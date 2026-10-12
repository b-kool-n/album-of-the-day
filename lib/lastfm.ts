import "server-only";

// Suggests the most-played song on an album, using Last.fm play counts.
// Returns null if there's no key or nothing useful comes back; the curator can always type it in.
export async function suggestTopSong(artist: string, trackNames: string[]): Promise<string | null> {
  const key = process.env.LASTFM_API_KEY;
  if (!key || trackNames.length === 0) return null;
  const firstArtist = artist.split(",")[0].trim();

  const counts = await Promise.all(
    trackNames.slice(0, 30).map(async (name) => {
      const url = new URL("https://ws.audioscrobbler.com/2.0/");
      url.search = new URLSearchParams({
        method: "track.getInfo",
        api_key: key,
        artist: firstArtist,
        track: name,
        autocorrect: "1",
        format: "json",
      }).toString();
      try {
        const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
        if (!res.ok) return { name, plays: 0 };
        const json = (await res.json()) as { track?: { playcount?: string } };
        return { name, plays: Number(json.track?.playcount ?? 0) };
      } catch {
        return { name, plays: 0 };
      }
    }),
  );

  const best = counts.sort((a, b) => b.plays - a.plays)[0];
  return best && best.plays > 0 ? best.name : null;
}
