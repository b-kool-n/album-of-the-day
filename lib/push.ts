import "server-only";
import webpush from "web-push";
import type { AdminClient } from "./supabase/admin";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };
type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

// Sends one notification to each device. Devices the phone has dropped (404/410) are removed.
export async function sendPush(admin: AdminClient, subs: Sub[], payload: PushPayload) {
  if (subs.length === 0) return { sentIds: [] as string[], failed: 0, removed: 0 };

  const { data: settings } = await admin.from("app_settings").select("key, value").in("key", ["vapid_public_key", "vapid_private_key", "vapid_subject"]);
  const s = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
  if (!s.vapid_public_key || !s.vapid_private_key) throw new Error("Notification keys are missing from the database.");
  webpush.setVapidDetails(s.vapid_subject || "https://github.com/b-kool-n/album-of-the-day", s.vapid_public_key, s.vapid_private_key);

  const body = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body, { TTL: 6 * 60 * 60, urgency: "normal" }),
    ),
  );

  const sentIds: string[] = [];
  const gone: string[] = [];
  let failed = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") sentIds.push(subs[i].id);
    else {
      const code = (r.reason as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) gone.push(subs[i].id);
      else failed++;
    }
  });
  if (gone.length) await admin.from("push_subscriptions").delete().in("id", gone);
  return { sentIds, failed, removed: gone.length };
}
