import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// One client per request. Reads and writes the login cookies.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a server component, where cookies are read-only. The proxy refreshes them instead.
          }
        },
      },
    },
  );
}

export async function getViewer() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;
  if (!userId) return { supabase, userId: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, is_admin")
    .eq("id", userId)
    .maybeSingle();
  return { supabase, userId, profile: profile as Profile | null };
}

export type Profile = { id: string; display_name: string; is_admin: boolean };
