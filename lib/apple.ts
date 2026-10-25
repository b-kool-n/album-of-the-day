import "server-only";
import { createPrivateKey, sign } from "node:crypto";
import type { AdminClient } from "@/lib/supabase/admin";

// Apple requires apps that offer Sign in with Apple to cancel the link when someone deletes
// their account. To do that we keep the refresh token Apple gives at sign-in, and hand it back
// to Apple on deletion. Nothing else uses it.

export const APPLE_APP_ID = "com.benkoolen.albumoftheday"; // iPhone app
export const APPLE_WEB_ID = "world.aotd.signin"; // website (Services ID)

export function hasAppleKey() {
  return !!(process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);
}

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

// A short-lived signed note that proves the request comes from us.
function clientSecret(clientId: string) {
  const key = createPrivateKey(process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "ES256", kid: process.env.APPLE_KEY_ID }));
  const body = b64url(
    JSON.stringify({ iss: process.env.APPLE_TEAM_ID, iat: now, exp: now + 300, aud: "https://appleid.apple.com", sub: clientId }),
  );
  const signature = sign("sha256", Buffer.from(`${header}.${body}`), { key, dsaEncoding: "ieee-p1363" });
  return `${header}.${body}.${b64url(signature)}`;
}

async function post(path: string, fields: Record<string, string>) {
  return fetch(`https://appleid.apple.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
  });
}

// Swaps the one-time code from the iPhone's Apple sign-in for a refresh token.
export async function refreshTokenFromCode(code: string, clientId = APPLE_APP_ID): Promise<string | null> {
  if (!hasAppleKey()) return null;
  const res = await post("/auth/token", {
    client_id: clientId,
    client_secret: clientSecret(clientId),
    code,
    grant_type: "authorization_code",
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => ({}))) as { refresh_token?: string };
  return json.refresh_token ?? null;
}

export async function saveAppleToken(admin: AdminClient, userId: string, refreshToken: string, clientId: string) {
  await admin.from("apple_tokens").upsert({ user_id: userId, refresh_token: refreshToken, client_id: clientId, created_at: new Date().toISOString() });
}

// Called just before an account is deleted. Never blocks the deletion: if Apple can't be
// reached, the account still goes.
export async function revokeAppleLink(admin: AdminClient, userId: string) {
  if (!hasAppleKey()) return;
  const { data } = await admin.from("apple_tokens").select("refresh_token, client_id").eq("user_id", userId).maybeSingle();
  if (!data) return;
  try {
    await post("/auth/revoke", {
      client_id: data.client_id,
      client_secret: clientSecret(data.client_id),
      token: data.refresh_token,
      token_type_hint: "refresh_token",
    });
  } catch {
    // Carry on with the deletion.
  }
}
