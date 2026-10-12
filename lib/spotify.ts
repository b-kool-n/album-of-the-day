import "server-only";
import type { Track } from "./types";

// Uses the app's own Spotify key (client credentials). Users never log in to Spotify.

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Spotify keys are missing. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel.");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Spotify refused the app's keys. Check the Client ID and Secret in Vercel.");
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export function parseSpotifyAlbumId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/album[/:]([A-Za-z0-9]{22})/);
  if (m) return m[1];
  return /^[A-Za-z0-9]{22}$/.test(s) ? s : null;
}

export type SpotifyAlbum = {
  spotify_id: string;
  artist: string;
  title: string;
  release_year: number | null;
  cover_url: string | null;
  spotify_url: string;
  tracks: Track[];
};

export async function fetchSpotifyAlbum(albumId: string): Promise<SpotifyAlbum> {
  const token = await getToken();
  const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}?market=GB`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) throw new Error("Spotify couldn't find that album. Check the link.");
  if (res.status === 429) throw new Error("Spotify is limiting requests right now. Try again in a minute.");
  if (!res.ok) throw new Error(`Spotify returned an error (${res.status}). Try again shortly.`);
  const a = (await res.json()) as {
    id: string;
    name: string;
    release_date?: string;
    artists: { name: string }[];
    images: { url: string; width: number }[];
    external_urls: { spotify: string };
    tracks: { items: { name: string; duration_ms: number; track_number: number; disc_number: number }[] };
  };
  const cover = [...(a.images ?? [])].sort((x, y) => (y.width ?? 0) - (x.width ?? 0))[0]?.url ?? null;
  return {
    spotify_id: a.id,
    artist: a.artists.map((x) => x.name).join(", "),
    title: a.name,
    release_year: a.release_date ? Number(a.release_date.slice(0, 4)) : null,
    cover_url: cover,
    spotify_url: a.external_urls?.spotify ?? `https://open.spotify.com/album/${a.id}`,
    tracks: (a.tracks?.items ?? []).map((t, i) => ({ number: i + 1, name: t.name, duration_ms: t.duration_ms })),
  };
}
