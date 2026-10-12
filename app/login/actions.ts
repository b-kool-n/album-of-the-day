"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string };

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
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
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
