import { unauthorised, viewerFromRequest } from "@/lib/supabase/bearer";
import { createAdminClient, hasAdminKey, SECRET_KEY_MISSING } from "@/lib/supabase/admin";
import { sendAppPush } from "@/lib/expo-push";

// Phone app: send a test notification to the signed-in person's phones.
export async function POST(request: Request) {
  const viewer = await viewerFromRequest(request);
  if (!viewer) return unauthorised();
  if (!hasAdminKey()) return Response.json({ error: SECRET_KEY_MISSING }, { status: 503 });

  const admin = createAdminClient();
  const { data: tokens } = await admin.from("device_tokens").select("id, token").eq("user_id", viewer.userId);
  if (!tokens?.length) return Response.json({ error: "This phone isn't signed up yet. Turn notifications on first." }, { status: 400 });

  const r = await sendAppPush(admin, tokens, {
    title: "Album of the Day",
    body: "Notifications are working. You'll get one each morning when the new album is out.",
    data: { path: "/account" },
  });
  if (r.sentIds.length === 0) return Response.json({ error: "Your phone didn't accept it. Turn notifications off and on again." }, { status: 502 });
  return Response.json({ done: `Sent to ${r.sentIds.length} ${r.sentIds.length === 1 ? "phone" : "phones"}. It should arrive in a few seconds.` });
}
