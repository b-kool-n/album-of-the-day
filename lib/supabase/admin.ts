import "server-only";
import { createClient } from "@supabase/supabase-js";

export const SECRET_KEY_MISSING =
  "The app's Supabase secret key isn't set up yet. Add SUPABASE_SECRET_KEY in Vercel's Environment Variables, then redeploy.";

export function hasAdminKey() {
  return !!process.env.SUPABASE_SECRET_KEY;
}

// Server-only client that bypasses the database's access rules.
// Used for sending notifications, saving devices and deleting accounts. Never sent to the browser.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error(SECRET_KEY_MISSING);
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminClient = ReturnType<typeof createAdminClient>;
