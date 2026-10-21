import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://aotd.world";

// Same database as the website. The publishable key is meant to be in the app:
// the database's access rules decide what each signed-in person can read and change.
export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the sign-in fresh only while the app is open.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

// Calls the website's /api/app/* endpoints for the few things the phone can't do directly
// (looking albums up on Spotify, deleting an account, sending a test notification).
export async function callWeb<T = { done?: string }>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your sign-in has expired. Sign in again.");
  let res: Response;
  try {
    res = await fetch(`${WEB_URL}${path}`, {
      method: init.method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new Error("Couldn't connect. Check your signal and try again.");
  }
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Something went wrong. Try again.");
  return json;
}
