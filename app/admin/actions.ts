"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/supabase/server";
import { addDays, formatDay, isIsoDate, ukToday } from "@/lib/dates";
import { fetchSpotifyAlbum, parseSpotifyAlbumId, searchSpotifyAlbum } from "@/lib/spotify";
import { suggestTopSong } from "@/lib/lastfm";

export type AdminState = { error?: string; done?: string };

type Db = Awaited<ReturnType<typeof getViewer>>["supabase"];

async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer.profile?.is_admin) throw new Error("Only the curator can do this.");
  return viewer.supabase;
}

function refreshAll(day?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/archive");
  revalidatePath("/suggest");
  if (day) revalidatePath(`/day/${day}`);
}

// Look the album up on Spotify and save it (or refresh it if we already have it).
async function upsertFromSpotify(supabase: Db, link: string, topSong: string, suggestedBy?: string) {
  const spotifyId = parseSpotifyAlbumId(link);
  if (!spotifyId) throw new Error("That doesn't look like a Spotify album link. It should start with https://open.spotify.com/album/");
  const album = await fetchSpotifyAlbum(spotifyId);
  const song = topSong || (await suggestTopSong(album.artist, album.tracks.map((t) => t.name))) || null;
  const row: Record<string, unknown> = { ...album, top_song: song, updated_at: new Date().toISOString() };
  if (suggestedBy) row.suggested_by = suggestedBy;
  const { data, error } = await supabase.from("albums").upsert(row, { onConflict: "spotify_id" }).select("id, title, top_song").single();
  if (error || !data) throw new Error("Couldn't save the album. Try again.");
  return data as { id: string; title: string; top_song: string | null };
}

// Checks a date can take an album. Returns an error message, or null if it's free.
async function dateProblem(supabase: Db, day: string): Promise<string | null> {
  if (!isIsoDate(day)) return "Pick a date.";
  if (day < ukToday()) return "Pick today or a future date.";
  const { data: taken } = await supabase.from("album_days").select("day").eq("day", day).maybeSingle();
  return taken ? `${formatDay(day)} already has an album.` : null;
}

// Add an album from a Spotify link. With a date it's scheduled; without one it goes into the back catalogue.
export async function scheduleAlbum(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const day = String(formData.get("day") ?? "").trim();
    const link = String(formData.get("link") ?? "");
    const topSong = String(formData.get("top_song") ?? "").trim();
    if (day) {
      const problem = await dateProblem(supabase, day);
      if (problem) return { error: problem };
    }
    const album = await upsertFromSpotify(supabase, link, topSong);
    const song = `Most played: ${album.top_song ?? "not found, add it below"}.`;
    if (!day) {
      refreshAll();
      return { done: `${album.title} is in the back catalogue. ${song}` };
    }
    const { error } = await supabase.from("album_days").insert({ day, album_id: album.id });
    if (error) return { error: "Saved the album, but couldn't schedule it. Schedule it from the back catalogue." };
    refreshAll(day);
    return { done: `${album.title} is scheduled for ${formatDay(day)}. ${song}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function updateDay(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const day = String(formData.get("day") ?? "");
    const link = String(formData.get("link") ?? "").trim();
    const topSong = String(formData.get("top_song") ?? "").trim();
    const { data: row } = await supabase.from("album_days").select("album_id").eq("day", day).maybeSingle();
    if (!row) return { error: "That day isn't scheduled." };

    if (link) {
      // Pull the details from Spotify. If it's a different album, it replaces the day's album;
      // the old one stays in the back catalogue.
      const album = await upsertFromSpotify(supabase, link, topSong);
      if (album.id !== row.album_id) {
        const { error } = await supabase.from("album_days").update({ album_id: album.id }).eq("day", day);
        if (error) return { error: "Couldn't change the album for that day." };
        // A placeholder added without a Spotify link is replaced, not kept in the back catalogue.
        const { data: old } = await supabase.from("albums").select("spotify_id").eq("id", row.album_id).maybeSingle();
        if (old && !old.spotify_id) {
          const { count } = await supabase.from("album_days").select("day", { count: "exact", head: true }).eq("album_id", row.album_id);
          if (!count) await supabase.from("albums").delete().eq("id", row.album_id);
        }
      }
    } else if (topSong) {
      const { error } = await supabase.from("albums").update({ top_song: topSong, updated_at: new Date().toISOString() }).eq("id", row.album_id);
      if (error) return { error: "Couldn't save the song." };
    } else {
      return { error: "Paste a Spotify link or type the most-played song." };
    }
    refreshAll(day);
    return { done: "Saved." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

// Takes an album off a future date. It goes back into the back catalogue.
export async function removeDay(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const day = String(formData.get("day") ?? "");
    if (formData.get("confirm") !== "on") return { error: "Tick the box to confirm." };
    if (day <= ukToday()) return { error: "Only future days can be cleared." };
    const { error } = await supabase.from("album_days").delete().eq("day", day);
    if (error) return { error: "Couldn't clear that day." };
    refreshAll(day);
    return { done: "Cleared. The album is back in the back catalogue." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

// ===== Suggestions =====

export async function approveSubmission(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const day = String(formData.get("day") ?? "").trim();
    const { data: sub } = await supabase.from("submissions").select("id, user_id, spotify_url, status").eq("id", id).maybeSingle();
    if (!sub) return { error: "That suggestion no longer exists." };
    if (sub.status !== "pending") return { error: "That suggestion has already been reviewed." };
    if (day) {
      const problem = await dateProblem(supabase, day);
      if (problem) return { error: problem };
    }

    const album = await upsertFromSpotify(supabase, sub.spotify_url as string, "", sub.user_id as string);
    const { error } = await supabase.from("submissions").update({ status: "approved", album_id: album.id }).eq("id", id);
    if (error) return { error: "Added the album, but couldn't mark the suggestion as approved. Try again." };

    if (day) {
      const { error: dayError } = await supabase.from("album_days").insert({ day, album_id: album.id });
      if (dayError) return { error: "Approved and added to the back catalogue, but couldn't schedule it. Schedule it from there." };
    }
    refreshAll(day || undefined);
    return { done: day ? `${album.title} approved and scheduled for ${formatDay(day)}.` : `${album.title} approved and added to the back catalogue.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function rejectSubmission(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const note = String(formData.get("note") ?? "").trim().slice(0, 280) || null;
    const { data, error } = await supabase
      .from("submissions")
      .update({ status: "rejected", review_note: note })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");
    if (error || !data?.length) return { error: "Couldn't update that suggestion. It may already have been reviewed." };
    refreshAll();
    return { done: "Turned down." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

// ===== Back catalogue =====

export async function scheduleFromCatalogue(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const albumId = String(formData.get("album_id") ?? "");
    const day = String(formData.get("day") ?? "").trim();
    const problem = await dateProblem(supabase, day);
    if (problem) return { error: problem };
    const { error } = await supabase.from("album_days").insert({ day, album_id: albumId });
    if (error) return { error: "Couldn't schedule it. Try again." };
    refreshAll(day);
    return { done: `Scheduled for ${formatDay(day)}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function removeFromCatalogue(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const albumId = String(formData.get("album_id") ?? "");
    if (formData.get("confirm") !== "on") return { error: "Tick the box to confirm." };
    const { count } = await supabase.from("album_days").select("day", { count: "exact", head: true }).eq("album_id", albumId);
    if (count) return { error: "That album is scheduled. Clear its date first." };
    const { error } = await supabase.from("albums").delete().eq("id", albumId);
    if (error) return { error: "Couldn't remove it." };
    refreshAll();
    return { done: "Removed from the back catalogue." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

// ===== Bulk add =====

export type BulkLine = { line: string; day?: string; album?: string; note?: string; error?: string };
export type BulkState = { error?: string; done?: string; results?: BulkLine[] };

// Runs jobs a few at a time so Spotify doesn't start refusing.
async function inBatches<T, R>(items: T[], size: number, job: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(job))));
  return out;
}

// Paste a list (one album a line, as "Artist - Album" or a Spotify link). Each is found on Spotify
// and put on the next empty day, in order, from the start date. Matching suggestions are approved.
export async function bulkAdd(_prev: BulkState, formData: FormData): Promise<BulkState> {
  try {
    const supabase = await requireAdmin();
    const start = String(formData.get("start") ?? "").trim();
    if (!isIsoDate(start) || start < ukToday()) return { error: "Pick a start date from today onwards." };
    const lines = String(formData.get("list") ?? "")
      .split("\n")
      .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);
    if (!lines.length) return { error: "Paste at least one album." };
    if (lines.length > 60) return { error: "Add up to 60 at a time." };

    // 1. Find each one on Spotify.
    const found = await inBatches(lines, 4, async (line) => {
      try {
        const fromLink = parseSpotifyAlbumId(line);
        if (fromLink) return { line, id: fromLink };
        const m = line.replace(/\s*\((?:19|20)\d\d\)\s*$/, "").match(/^(.+?)\s+[–—-]\s+(.+)$/);
        if (!m) return { line, error: "Write it as Artist - Album, or paste a Spotify link." };
        const id = await searchSpotifyAlbum(m[1].trim(), m[2].trim());
        return id ? { line, id } : { line, error: "Not found on Spotify. Add it with a link instead." };
      } catch (e) {
        return { line, error: e instanceof Error ? e.message : "Spotify lookup failed." };
      }
    });

    // 2. Skip anything already played or scheduled.
    const ids = found.flatMap((f) => ("id" in f && f.id ? [f.id] : []));
    const [{ data: known }, { data: subs }, { data: takenDays }] = await Promise.all([
      supabase.from("albums").select("id, spotify_id, album_days(day)").in("spotify_id", ids),
      supabase.from("submissions").select("id, user_id, spotify_id").eq("status", "pending").in("spotify_id", ids),
      supabase.from("album_days").select("day").gte("day", start),
    ]);
    const scheduledOn = new Map<string, string>();
    for (const a of (known ?? []) as { spotify_id: string; album_days: { day: string }[] }[]) {
      const d = a.album_days?.map((x) => x.day).sort()[0];
      if (d) scheduledOn.set(a.spotify_id, d);
    }
    const taken = new Set((takenDays ?? []).map((d) => d.day as string));
    const seen = new Set<string>();

    // 3. Save each one from Spotify, then put it on the next empty day.
    const results: BulkLine[] = [];
    let day = start;
    const toSave = found.map((f) => {
      if (!("id" in f) || !f.id) return { ...f, skip: true };
      if (scheduledOn.has(f.id)) return { line: f.line, error: `Already on ${formatDay(scheduledOn.get(f.id)!)}.`, skip: true };
      if (seen.has(f.id)) return { line: f.line, error: "Listed twice.", skip: true };
      seen.add(f.id);
      return { ...f, skip: false };
    });
    const saved = await inBatches(toSave, 3, async (f) => {
      if (f.skip || !("id" in f) || !f.id) return { ...f };
      try {
        const sub = (subs ?? []).find((x) => x.spotify_id === f.id);
        const album = await upsertFromSpotify(supabase, f.id, "", (sub?.user_id as string | undefined) ?? undefined);
        if (sub) await supabase.from("submissions").update({ status: "approved", album_id: album.id }).eq("id", sub.id);
        const { data: full } = await supabase.from("albums").select("artist, title, release_year").eq("id", album.id).single();
        return { ...f, albumId: album.id, name: full ? `${full.artist} – ${full.title}${full.release_year ? ` (${full.release_year})` : ""}` : album.title, approved: !!sub };
      } catch (e) {
        return { ...f, error: e instanceof Error ? e.message : "Couldn't save it." };
      }
    });
    for (const f of saved) {
      const r = f as typeof f & { albumId?: string; name?: string; approved?: boolean; error?: string };
      if (!r.albumId) {
        results.push({ line: r.line, error: r.error ?? "Skipped." });
        continue;
      }
      while (taken.has(day)) day = addDays(day, 1);
      const { error } = await supabase.from("album_days").insert({ day, album_id: r.albumId });
      if (error) {
        results.push({ line: r.line, album: r.name, error: "Saved to the back catalogue, but couldn't schedule it." });
        continue;
      }
      taken.add(day);
      results.push({ line: r.line, day, album: r.name, note: r.approved ? "Suggestion approved" : undefined });
      day = addDays(day, 1);
    }

    refreshAll();
    const ok = results.filter((r) => r.day).length;
    const last = results.filter((r) => r.day).at(-1)?.day;
    return {
      done: ok ? `${ok} of ${lines.length} scheduled${last ? `, up to ${formatDay(last)}` : ""}. Check the matches below.` : undefined,
      error: ok ? undefined : "Nothing was scheduled. See below.",
      results,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
