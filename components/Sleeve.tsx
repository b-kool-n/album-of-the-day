import type { Album } from "@/lib/types";

const SLEEVE_COLOURS = ["#2B3A55", "#5B2333", "#1F4D3F", "#3D3A35", "#6B4E16", "#283845", "#4A2C4F", "#1E3B32", "#3B2A20", "#204059"];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Album cover, or a plain printed sleeve when there's no cover yet.
export function Sleeve({ album, number }: { album: Pick<Album, "artist" | "title" | "cover_url">; number?: number }) {
  const colour = SLEEVE_COLOURS[hash(album.artist + album.title) % SLEEVE_COLOURS.length];
  if (album.cover_url) {
    return (
      <div className="sleeve">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={album.cover_url} alt={`Cover of ${album.title} by ${album.artist}`} />
      </div>
    );
  }
  return (
    <div className="sleeve" style={{ ["--sleeve" as string]: colour }} role="img" aria-label={`${album.title} by ${album.artist}`}>
      <div className="s-code">AOTD {number ? String(number).padStart(3, "0") : ""}</div>
      <div>
        <div className="s-artist">{album.artist}</div>
        <div className="s-title">{album.title}</div>
      </div>
    </div>
  );
}
