"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/supabase/server";
import { fetchSpotifyAlbum, parseSpotifyAlbumId } from "@/lib/spotify";

export type SuggestState = { error?: string; done?: string; at?: number };

const ALREADY: Record<string, string> = {
  played: "That one's already been Album of the Day. Find it in the Archive.",
  in_catalogue: "That one's already lined up. Keep an eye out for it.",
  pending: "Someone's already suggested that one. It's waiting for review.",
};

export async function suggestAlbum(_prev: SuggestState, formData: FormData): Promise<SuggestState> {
  const { supabase, userId } = await getViewer();
  if (!userId) return { error: "Sign in to suggest an album." };

  const link = String(formData.get("link") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 280) || null;
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
    return { error: "Couldn't save your suggestion. Try again." };
  }

  revalidatePath("/suggest");
  revalidatePath("/", "layout");
  return { done: `Thanks. ${album.title} by ${album.artist} is waiting for review.`, at: Date.now() };
}

export async function withdrawSuggestion(formData: FormData) {
  const { supabase, userId } = await getViewer();
  if (!userId) return;
  const id = String(formData.get("id") ?? "");
  await supabase.from("submissions").delete().eq("id", id).eq("user_id", userId).eq("status", "pending");
  revalidatePath("/suggest");
  revalidatePath("/", "layout");
}
