import "server-only";
import { createClient } from "@supabase/supabase-js";

// For the phone app: it sends its Supabase login token as "Authorization: Bearer <token>"
// instead of cookies. The token is checked before anything runs, and the database's access
// rules apply to every query made with this client, exactly as they do on the website.
export async function viewerFromRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub as string | undefined;
  if (error || !userId) return null;
  return { supabase, userId };
}

export function unauthorised() {
  return Response.json({ error: "Your sign-in has expired. Sign in again." }, { status: 401 });
}
