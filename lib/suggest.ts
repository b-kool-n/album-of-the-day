import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchSpotifyAlbum, parseSpotifyAlbumId } from "./spotify";

const ALREADY: Record<string, string> = {
  played: "That one's already been Album of the Day. Find it in the Archive.",
  in_catalogue: "That one's already lined up. Keep an eye out for it.",
  pending: "Someone's already suggested that one. It's waiting for review.",
};

// Looks the album up on Spotify and saves the suggestion. Used by the website and the phone app.
export async function submitSuggestion(
  supabase: SupabaseClient,
  userId: string,
  link: string,
  reasonInput: string,
): Promise<{ error: string } | { done: string }> {
  const reason = reasonInput.trim().slice(0, 280) || null;
  const spotifyId = parseSpotifyAlbumId(link);
  if (!spotifyId) return { error: "That doesn't look like a Spotify album link. In Spotify, open the album, then Share → Copy link to album." };

  const { data: status } = await supabase.rpc("album_status", { sid: spotifyId });
  if (typeof status === "string" && ALREADY[status]) return { error: ALREADY[status] };

  let album;
  try {
    album = await fetchSpotifyAlbum(spotifyId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't look that album up on Spotify. Try again." };
  }

  const { error } = await supabase.from("submissions").insert({
    user_id: userId,
    spotify_id: album.spotify_id,
    spotify_url: album.spotify_url,
    artist: album.artist,
    title: album.title,
    release_year: album.release_year,
    cover_url: album.cover_url,
    reason,
  });
  if (error) {
    if (error.message.includes("too_many_pending")) return { error: "You have 5 suggestions waiting for review. You can add more once some have been looked at." };
    if (error.code === "23505") return { error: ALREADY.pending };
    if (error.message.includes("banned_words")) return { error: "Your reason includes a word that isn't allowed here. Please reword it." };
    if (error.code === "42501") return { error: "Your account can't suggest albums at the moment." };
    return { error: "Couldn't save your suggestion. Try again." };
  }
  return { done: `Thanks. ${album.title} by ${album.artist} is waiting for review.` };
}
