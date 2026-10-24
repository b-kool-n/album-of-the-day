import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminKey, type AdminClient } from "@/lib/supabase/admin";
import { fetchSpotifyAlbum } from "@/lib/spotify";
import type { Track } from "@/lib/types";
import { sendPush } from "@/lib/push";
import { sendAppPush } from "@/lib/expo-push";
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
  await addSongLinks(createAdminClient(), ukToday());

  const ukHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }).format(new Date()));
  if (ukHour < 8 || ukHour > 9) return NextResponse.json({ skipped: `It's ${ukHour}:00 in the UK; sending happens from 8am` });

  const today = ukToday();
  const admin = createAdminClient();
  const { data: day } = await admin.from("album_days").select("albums(title, artist, release_year)").eq("day", today).maybeSingle();
  const album = day?.albums as unknown as { title: string; artist: string; release_year: number | null } | null;
  if (!album) return NextResponse.json({ skipped: "No album scheduled today" });

  const notSentToday = `last_sent_day.is.null,last_sent_day.neq.${today}`;
  const [{ data: subs, error }, { data: tokens, error: tokenError }] = await Promise.all([
    admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").or(notSentToday),
    admin.from("device_tokens").select("id, token").or(notSentToday),
  ]);
  if (error || tokenError) return NextResponse.json({ error: "Couldn't read devices" }, { status: 500 });

  const title = `Today's album: ${album.title}`;
  const body = `${album.artist}${album.release_year ? ` · ${album.release_year}` : ""}. Listen start to finish, then score it.`;

  // Browsers and home-screen web apps.
  const web = await sendPush(admin, subs ?? [], { title, body, url: "/", tag: `daily-${today}` });
  if (web.sentIds.length) await admin.from("push_subscriptions").update({ last_sent_day: today }).in("id", web.sentIds);

  // The iPhone and Android app.
  const app = await sendAppPush(admin, tokens ?? [], { title, body, data: { path: "/" } });
  if (app.sentIds.length) await admin.from("device_tokens").update({ last_sent_day: today }).in("id", app.sentIds);

  return NextResponse.json({
    day: today,
    web: { sent: web.sentIds.length, failed: web.failed, removed: web.removed },
    app: { sent: app.sentIds.length, failed: app.failed, removed: app.removed },
  });
}

// Albums added before song links were stored get them on the morning they play, so the
// tracklist can open each song straight in Spotify.
async function addSongLinks(admin: AdminClient, day: string) {
  try {
    const { data } = await admin.from("album_days").select("albums(id, spotify_id, tracks)").eq("day", day).maybeSingle();
    const album = data?.albums as unknown as { id: string; spotify_id: string | null; tracks: Track[] } | null;
    if (!album?.spotify_id || (album.tracks.length > 0 && album.tracks.every((t) => t.url))) return;
    const fresh = await fetchSpotifyAlbum(album.spotify_id);
    await admin.from("albums").update({ tracks: fresh.tracks }).eq("id", album.id);
  } catch {
    // Not worth failing the morning notification over.
  }
}
