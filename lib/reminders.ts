import "server-only";
import type { AdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/push";
import { sendAppPush } from "@/lib/expo-push";
import { ukToday } from "@/lib/dates";
import { REMINDER_TIMES } from "@/lib/reminder-times";

// The time on a UK clock right now, as "HH:MM".
export function ukClock(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
}

// Sends today's notification to every device whose owner's chosen time has arrived and that
// hasn't had one today. Safe to call as often as you like: nobody gets two in a day.
export async function sendDueReminders(admin: AdminClient) {
  const today = ukToday();
  const now = ukClock();
  if (now < REMINDER_TIMES[0]) return { skipped: `It's ${now} in the UK; nothing goes out before ${REMINDER_TIMES[0]}` };

  const { data: day } = await admin.from("album_days").select("albums(title, artist, release_year)").eq("day", today).maybeSingle();
  const album = day?.albums as unknown as { title: string; artist: string; release_year: number | null } | null;
  if (!album) return { skipped: "No album scheduled today" };

  const { data: due, error: dueError } = await admin.from("profiles").select("id").lte("reminder_time", `${now}:00`);
  if (dueError) throw new Error("Couldn't read reminder times");
  const ids = (due ?? []).map((p) => p.id as string);
  if (!ids.length) return { day: today, at: now, web: { sent: 0 }, app: { sent: 0 } };

  const notSentToday = `last_sent_day.is.null,last_sent_day.neq.${today}`;
  const [{ data: subs, error }, { data: tokens, error: tokenError }] = await Promise.all([
    admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", ids).or(notSentToday),
    admin.from("device_tokens").select("id, token").in("user_id", ids).or(notSentToday),
  ]);
  if (error || tokenError) throw new Error("Couldn't read devices");

  const title = `Today's album: ${album.title}`;
  const body = `${album.artist}${album.release_year ? ` · ${album.release_year}` : ""}. Listen start to finish, then score it.`;

  // Browsers and home-screen web apps.
  const web = await sendPush(admin, subs ?? [], { title, body, url: "/", tag: `daily-${today}` });
  if (web.sentIds.length) await admin.from("push_subscriptions").update({ last_sent_day: today }).in("id", web.sentIds);

  // The iPhone and Android app.
  const app = await sendAppPush(admin, tokens ?? [], { title, body, data: { path: "/" } });
  if (app.sentIds.length) await admin.from("device_tokens").update({ last_sent_day: today }).in("id", app.sentIds);

  return {
    day: today,
    at: now,
    web: { sent: web.sentIds.length, failed: web.failed, removed: web.removed },
    app: { sent: app.sentIds.length, failed: app.failed, removed: app.removed },
  };
}
