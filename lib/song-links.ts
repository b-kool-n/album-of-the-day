import "server-only";
import type { AdminClient } from "@/lib/supabase/admin";
import { fetchSpotifyAlbum } from "@/lib/spotify";
import type { Track } from "@/lib/types";

// Albums added before song links were stored get them on the morning they play, so the
// tracklist can open each song straight in Spotify.
export async function addSongLinks(admin: AdminClient, day: string) {
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
