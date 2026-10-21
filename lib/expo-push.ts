import "server-only";
import type { AdminClient } from "./supabase/admin";

// Notifications for the iPhone and Android app, sent through Expo's push service,
// which passes them on to Apple and Google.
const EXPO_SEND = "https://exp.host/--/api/v2/push/send";

type Token = { id: string; token: string };
export type AppPush = { title: string; body: string; data?: Record<string, string> };

export async function sendAppPush(admin: AdminClient, tokens: Token[], message: AppPush) {
  const sentIds: string[] = [];
  const gone: string[] = [];
  let failed = 0;

  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  // Only needed if "enhanced push security" is switched on in the Expo project.
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

  // Expo accepts up to 100 messages per request.
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const res = await fetch(EXPO_SEND, {
      method: "POST",
      headers,
      body: JSON.stringify(
        batch.map((t) => ({ to: t.token, title: message.title, body: message.body, data: message.data, sound: "default", ttl: 6 * 60 * 60 })),
      ),
      cache: "no-store",
    }).catch(() => null);
    if (!res?.ok) {
      failed += batch.length;
      continue;
    }
    const json = (await res.json().catch(() => ({}))) as { data?: { status: string; details?: { error?: string } }[] };
    (json.data ?? []).forEach((ticket, j) => {
      const t = batch[j];
      if (!t) return;
      if (ticket.status === "ok") sentIds.push(t.id);
      else if (ticket.details?.error === "DeviceNotRegistered") gone.push(t.id);
      else failed++;
    });
  }

  // The app was deleted or notifications were switched off on that phone.
  if (gone.length) await admin.from("device_tokens").delete().in("id", gone);
  return { sentIds, failed, removed: gone.length };
}
