import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { APPLE_WEB_ID, saveAppleToken } from "@/lib/apple";

// Where email confirmation links, and Apple and Google sign-in, land.
// Swaps the one-time code in the link for a login session, then sends the person on.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Keep Apple's token so the link can be cancelled if the account is deleted.
      const appleToken = data.session?.provider_refresh_token;
      if (appleToken && data.user?.app_metadata?.provider === "apple" && hasAdminKey()) {
        await saveAppleToken(createAdminClient(), data.user.id, appleToken, APPLE_WEB_ID).catch(() => {});
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
