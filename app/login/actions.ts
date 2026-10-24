"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string };

// The address this request came in on, so email links point back at the live site, not localhost.
async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match. Try again." };
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name) return { error: "Add a name so friends know whose scores are whose." };
  if (!email) return { error: "Enter your email." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name }, emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { error: "There's already an account with that email. Sign in instead." };
    return { error: error.message };
  }
  if (!data.session) return { info: "Account created. Check your email to confirm it, then sign in." };
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ===== Forgotten password =====

export async function sendReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email you signed up with." };
  const supabase = await createClient();
  // The email's link goes to /auth/confirm (see the "Reset password" email template), which signs
  // the person in and opens the page for choosing a new password. It works in any browser.
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await siteOrigin()}/account/password` });
  // Same reply whether or not there's an account, so the form can't be used to check who has one.
  return { info: "If there's an account with that email, a link to choose a new password is on its way. It works for an hour." };
}

// ===== Apple and Google =====

export async function continueWith(formData: FormData) {
  const provider = String(formData.get("provider") ?? "");
  if (provider !== "apple" && provider !== "google") return;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=provider");
  redirect(data.url);
}
