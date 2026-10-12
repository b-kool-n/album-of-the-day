import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { addDays, formatDay, ukToday } from "@/lib/dates";
import type { Album } from "@/lib/types";
import { Sleeve } from "@/components/Sleeve";
import { EditDay, ScheduleForm } from "./forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Album of the Day" };

export default async function AdminPage() {
  const { supabase, profile } = await getViewer();
  if (!profile?.is_admin) redirect("/");

  const today = ukToday();
  const { data } = await supabase
    .from("album_days")
    .select("day, albums(id, artist, title, cover_url, top_song, spotify_id)")
    .order("day", { ascending: false });
  const rows = (data ?? []) as unknown as { day: string; albums: Pick<Album, "id" | "artist" | "title" | "cover_url" | "top_song" | "spotify_id"> }[];
  const scheduled = new Set(rows.map((r) => r.day));
  let suggested = today;
  while (scheduled.has(suggested)) suggested = addDays(suggested, 1);
  const tomorrow = addDays(today, 1);
  const ahead = rows.filter((r) => r.day > today).length;

  return (
    <>
      {scheduled.has(tomorrow) ? (
        <div className="banner">{ahead} {ahead === 1 ? "day" : "days"} scheduled ahead.</div>
      ) : (
        <div className="banner"><b>Tomorrow has no album.</b> Schedule one so nobody opens an empty page.</div>
      )}
      <ScheduleForm suggestedDay={suggested} />

      <h2 className="section-title">Schedule</h2>
      <ul className="list">
        {rows.map((r) => (
          <li className="admin-item" key={r.day}>
            <div className="item">
              <div className="thumb"><Sleeve album={r.albums} /></div>
              <div className="main">
                <div className="d">
                  {formatDay(r.day)}{" "}
                  {r.day === today ? <span className="chip hot">Today</span> : r.day > today ? <span className="chip">Upcoming</span> : null}{" "}
                  {!r.albums.spotify_id && <span className="chip">No Spotify link</span>}
                </div>
                <div className="t">{r.albums.title}</div>
                <div className="a">{r.albums.artist}{r.albums.top_song ? ` · ${r.albums.top_song}` : ""}</div>
              </div>
            </div>
            <EditDay day={r.day} topSong={r.albums.top_song} hasSpotify={!!r.albums.spotify_id} canRemove={r.day > today} />
          </li>
        ))}
      </ul>
    </>
  );
}
