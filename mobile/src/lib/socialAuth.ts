import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { callWeb, supabase } from "./supabase";

export type Providers = { apple: boolean; google: boolean };

// Which "Continue with…" buttons to show. Read from Supabase's public settings, so a button
// appears as soon as that sign-in is switched on in Supabase, with no new build needed.
export async function enabledProviders(): Promise<Providers> {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    });
    if (!res.ok) return { apple: false, google: false };
    const json = (await res.json()) as { external?: Record<string, boolean> };
    let apple = !!json.external?.apple;
    if (apple && Platform.OS === "ios") apple = await AppleAuthentication.isAvailableAsync();
    return { apple, google: !!json.external?.google };
  } catch {
    return { apple: false, google: false };
  }
}

function cancelled(e: unknown) {
  const code = (e as { code?: string })?.code;
  return code === "ERR_REQUEST_CANCELED" || code === "ERR_CANCELED";
}

// iPhone: Apple's own sign-in sheet.
export async function signInWithApple(): Promise<void> {
  if (Platform.OS !== "ios") return signInInBrowser("apple");
  // A one-off code that ties Apple's answer to this sign-in, so it can't be replayed.
  const raw = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
  } catch (e) {
    if (cancelled(e)) return;
    throw new Error("Apple sign-in didn't work. Try again, or use your email.");
  }
  if (!credential.identityToken) throw new Error("Apple sign-in didn't work. Try again, or use your email.");

  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken, nonce: raw });
  if (error || !data.user) throw new Error("Apple sign-in didn't work. Try again, or use your email.");

  // Keeps the token needed to cancel the Apple link if this account is ever deleted.
  if (credential.authorizationCode) {
    callWeb("/api/app/apple-token", { method: "POST", body: { code: credential.authorizationCode } }).catch(() => {});
  }

  // Apple only shares the person's name the very first time, so save it now.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ").trim().slice(0, 40);
  if (name) {
    await supabase.auth.updateUser({ data: { full_name: name } });
    await supabase.from("profiles").update({ display_name: name }).eq("id", data.user.id);
  }
}

// Google (and Apple on Android): the provider's page in a secure browser sheet, then back to the app.
export async function signInInBrowser(provider: "google" | "apple"): Promise<void> {
  const redirectTo = Linking.createURL("auth");
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) throw new Error("That sign-in option isn't available right now. Use your email instead.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return;
  const back = new URL(result.url);
  const code = back.searchParams.get("code");
  if (!code) throw new Error("Sign-in didn't finish. Try again, or use your email.");
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw new Error("Sign-in didn't finish. Try again, or use your email.");
}
