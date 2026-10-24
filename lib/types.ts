export type Track = { number: number; name: string; duration_ms: number; url?: string };

// The song's own Spotify link when we have it, otherwise a Spotify search for it.
export function trackLink(album: Pick<Album, "artist">, track: Track): string {
  if (track.url && track.url.startsWith("https://open.spotify.com/")) return track.url;
  return "https://open.spotify.com/search/" + encodeURIComponent(`${album.artist} ${track.name}`);
}

export function isTopSong(album: Pick<Album, "top_song">, track: Track): boolean {
  const clean = (x: string) => x.toLowerCase().replace(/\s*[-(].*(remaster|version|mono|stereo|edit|mix).*$/i, "").trim();
  return !!album.top_song && clean(album.top_song) === clean(track.name);
}

export function trackLength(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type Album = {
  id: string;
  spotify_id: string | null;
  artist: string;
  title: string;
  release_year: number | null;
  cover_url: string | null;
  spotify_url: string | null;
  tracks: Track[];
  top_song: string | null;
};

export type Rating = {
  user_id: string;
  day: string;
  back_to_back: number;
  vibes: number;
  nostalgia: number | null;
  relisten: number;
  new_to_me: boolean;
  overall: number;
  note: string | null;
  late: boolean;
  created_day: string;
  updated_at: string;
};

export type DayAverages = {
  day: string;
  ratings: number;
  back_to_back: number | null;
  vibes: number | null;
  nostalgia: number | null;
  nostalgia_ratings: number;
  relisten: number | null;
  overall: number | null;
};

export const MEASURES = [
  { key: "back_to_back", name: "Back-to-back song quality", short: "Back-to-back", question: "Does every song hold up, start to finish?" },
  { key: "vibes", name: "Vibes", short: "Vibes", question: "How does it make you feel?" },
  { key: "relisten", name: "Relistenability", short: "Relisten", question: "Would you choose to put it on again?" },
  // Last, because "New to me" sits straight under it and leaves it out.
  { key: "nostalgia", name: "Nostalgia", short: "Nostalgia", question: "Does it take you back to a time, a place or a memory?" },
] as const;

export type MeasureKey = (typeof MEASURES)[number]["key"];

export function oneDecimal(n: number | null | undefined): string {
  return n == null || Number.isNaN(Number(n)) ? "–" : Number(n).toFixed(1);
}

export function spotifyLink(album: Pick<Album, "spotify_url" | "artist" | "title">): string {
  if (album.spotify_url && album.spotify_url.startsWith("https://open.spotify.com/")) return album.spotify_url;
  return "https://open.spotify.com/search/" + encodeURIComponent(`${album.artist} ${album.title}`);
}
