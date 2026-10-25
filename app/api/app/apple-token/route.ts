import { unauthorised, viewerFromRequest } from "@/lib/supabase/bearer";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { APPLE_APP_ID, hasAppleKey, refreshTokenFromCode, saveAppleToken } from "@/lib/apple";

// Phone app: after Sign in with Apple, keeps the token needed to cancel the Apple link if the
// person later deletes their account. Body: { code: string }
export async function POST(request: Request) {
  const viewer = await viewerFromRequest(request);
  if (!viewer) return unauthorised();
  const body = (await request.json().catch(() => ({}))) as { code?: unknown };
  const code = typeof body.code === "string" ? body.code : "";
  if (!code) return Response.json({ error: "Missing code." }, { status: 400 });
  if (!hasAdminKey() || !hasAppleKey()) return Response.json({ done: false });

  const token = await refreshTokenFromCode(code, APPLE_APP_ID);
  if (!token) return Response.json({ done: false });
  await saveAppleToken(createAdminClient(), viewer.userId, token, APPLE_APP_ID);
  return Response.json({ done: true });
}
