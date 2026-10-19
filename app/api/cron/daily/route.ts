import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/push";
import { ukToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Called by Vercel twice a day (07:00 and 08:00 UTC; see vercel.json). Only sends between 8 and 10am UK time,
// which covers both summer and winter time, and each device gets at most one notification a day.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  if (!hasAdminKey()) return NextResponse.json({ skipped: "SUPABASE_SECRET_KEY is not set" });

  const ukHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }).format(new Date()));
  if (ukHour < 8 || ukHour > 9) return NextResponse.json({ skipped: `It's ${ukHour}:00 in the UK; sending happens from 8am` });

  const today = ukToday();
  const admin = createAdminClient();
  const { data: day } = await admin.from("album_days").select("albums(title, artist, release_year)").eq("day", today).maybeSingle();
  const album = day?.albums as unknown as { title: string; artist: string; release_year: number | null } | null;
  if (!album) return NextResponse.json({ skipped: "No album scheduled today" });

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .or(`last_sent_day.is.null,last_sent_day.neq.${today}`);
  if (error) return NextResponse.json({ error: "Couldn't read devices" }, { status: 500 });

  const result = await sendPush(admin, subs ?? [], {
    title: `Today's album: ${album.title}`,
    body: `${album.artist}${album.release_year ? ` · ${album.release_year}` : ""}. Listen start to finish, then score it.`,
    url: "/",
    tag: `daily-${today}`,
  });
  if (result.sentIds.length) await admin.from("push_subscriptions").update({ last_sent_day: today }).in("id", result.sentIds);

  return NextResponse.json({ day: today, sent: result.sentIds.length, failed: result.failed, removed: result.removed });
}
