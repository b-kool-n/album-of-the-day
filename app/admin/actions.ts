"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/supabase/server";
import { isIsoDate, ukToday } from "@/lib/dates";
import { fetchSpotifyAlbum, parseSpotifyAlbumId } from "@/lib/spotify";
import { suggestTopSong } from "@/lib/lastfm";

export type AdminState = { error?: string; done?: string };

async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer.profile?.is_admin) throw new Error("Only the curator can do this.");
  return viewer.supabase;
}

function refreshAll(day?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/archive");
  if (day) revalidatePath(`/day/${day}`);
}

// Look the album up on Spotify and save it (or refresh it if we already have it). Returns the album id.
async function upsertFromSpotify(supabase: Awaited<ReturnType<typeof requireAdmin>>, link: string, topSong: string) {
  const spotifyId = parseSpotifyAlbumId(link);
  if (!spotifyId) throw new Error("That doesn't look like a Spotify album link. It should start with https://open.spotify.com/album/");
  const album = await fetchSpotifyAlbum(spotifyId);
  const suggested = topSong || (await suggestTopSong(album.artist, album.tracks.map((t) => t.name))) || null;
  const { data, error } = await supabase
    .from("albums")
    .upsert({ ...album, top_song: suggested, updated_at: new Date().toISOString() }, { onConflict: "spotify_id" })
    .select("id, title, top_song")
    .single();
  if (error || !data) throw new Error("Couldn't save the album. Try again.");
  return data as { id: string; title: string; top_song: string | null };
}

export async function scheduleAlbum(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const day = String(formData.get("day") ?? "");
    const link = String(formData.get("link") ?? "");
    const topSong = String(formData.get("top_song") ?? "").trim();
    if (!isIsoDate(day)) return { error: "Pick a date." };
    if (day < ukToday()) return { error: "Pick today or a future date." };

    const { data: taken } = await supabase.from("album_days").select("day").eq("day", day).maybeSingle();
    if (taken) return { error: "That date already has an album. Change it from the schedule below." };

    const album = await upsertFromSpotify(supabase, link, topSong);
    const { error } = await supabase.from("album_days").insert({ day, album_id: album.id });
    if (error) return { error: "Couldn't schedule it. Try again." };
    refreshAll(day);
    return { done: `${album.title} is scheduled. Most played: ${album.top_song ?? "not found, add it below"}.` };
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
      // Pull the details from Spotify. If this album is new, it replaces the day's album.
      const album = await upsertFromSpotify(supabase, link, topSong);
      if (album.id !== row.album_id) {
        const { error } = await supabase.from("album_days").update({ album_id: album.id }).eq("day", day);
        if (error) return { error: "Couldn't change the album for that day." };
        // Tidy up: remove the old album row if no other day uses it.
        const { count } = await supabase.from("album_days").select("day", { count: "exact", head: true }).eq("album_id", row.album_id);
        if (!count) await supabase.from("albums").delete().eq("id", row.album_id);
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

export async function removeDay(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    const supabase = await requireAdmin();
    const day = String(formData.get("day") ?? "");
    if (formData.get("confirm") !== "on") return { error: "Tick the box to confirm." };
    if (day <= ukToday()) return { error: "Only future days can be removed." };
    const { error } = await supabase.from("album_days").delete().eq("day", day);
    if (error) return { error: "Couldn't remove it." };
    refreshAll(day);
    return { done: "Removed." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
