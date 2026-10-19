import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { addDays, formatDay, ukToday } from "@/lib/dates";
import type { Album } from "@/lib/types";
import { Sleeve } from "@/components/Sleeve";
import { CatalogueActions, EditDay, ReviewSubmission, ScheduleForm } from "./forms";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Album of the Day" };

type AlbumRow = Pick<Album, "id" | "artist" | "title" | "cover_url" | "top_song" | "spotify_id" | "release_year">;

export default async function AdminPage() {
  const { supabase, profile } = await getViewer();
  if (!profile?.is_admin) redirect("/");

  const today = ukToday();
  const [{ data: dayData }, { data: subData }, { data: albumData }, { count: reportedCount }, { count: feedbackCount }] = await Promise.all([
    supabase.from("album_days").select("day, albums(id, artist, title, cover_url, top_song, spotify_id, release_year)").order("day", { ascending: false }),
    supabase
      .from("submissions")
      .select("id, spotify_url, artist, title, release_year, cover_url, reason, created_at, profiles!submissions_user_id_fkey(display_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("albums")
      .select("id, artist, title, cover_url, top_song, spotify_id, release_year, created_at, profiles!albums_suggested_by_fkey(display_name), album_days!album_days_album_id_fkey(day)")
      .order("created_at", { ascending: false }),
    supabase.from("comments").select("id", { count: "exact", head: true }).gt("report_count", 0),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("handled", false),
  ]);

  const rows = (dayData ?? []) as unknown as { day: string; albums: AlbumRow }[];
  const pending = (subData ?? []) as unknown as {
    id: string; spotify_url: string; artist: string; title: string; release_year: number | null; cover_url: string | null;
    reason: string | null; created_at: string; profiles: { display_name: string } | null;
  }[];
  const catalogue = ((albumData ?? []) as unknown as (AlbumRow & { profiles: { display_name: string } | null; album_days: { day: string }[] })[])
    .filter((a) => a.album_days.length === 0);

  const scheduled = new Set(rows.map((r) => r.day));
  let nextFree = today;
  while (scheduled.has(nextFree)) nextFree = addDays(nextFree, 1);
  const ahead = rows.filter((r) => r.day > today).length;

  return (
    <>
      <AdminNav current="albums" albumsCount={pending.length} moderationCount={(reportedCount ?? 0) + (feedbackCount ?? 0)} />
      {!scheduled.has(today) ? (
        <div className="banner"><b>Today has no album.</b> Everyone is seeing an empty page. Schedule one below.</div>
      ) : !scheduled.has(addDays(today, 1)) ? (
        <div className="banner"><b>Tomorrow has no album.</b> Schedule one so nobody opens an empty page.</div>
      ) : (
        <div className="banner">{ahead} {ahead === 1 ? "day" : "days"} scheduled ahead. Next free date: {formatDay(nextFree)}.</div>
      )}

      <h2 className="section-title">Suggestions to review {pending.length > 0 && <span className="chip hot">{pending.length}</span>}</h2>
      {pending.length === 0 ? (
        <p className="msg">Nothing waiting. When someone suggests an album, it appears here.</p>
      ) : (
        <ul className="list">
          {pending.map((s) => (
            <li className="admin-item" key={s.id}>
              <div className="item">
                <div className="thumb"><Sleeve album={s} /></div>
                <div className="main">
                  <div className="d">From {s.profiles?.display_name || "someone"} · {formatDay(s.created_at.slice(0, 10))}</div>
                  <div className="t">{s.title}</div>
                  <div className="a">
                    {s.artist}{s.release_year ? ` · ${s.release_year}` : ""} · <a href={s.spotify_url} target="_blank" rel="noopener noreferrer">Open in Spotify</a>
                  </div>
                  {s.reason && <div className="note-line">&ldquo;{s.reason}&rdquo;</div>}
                </div>
              </div>
              <ReviewSubmission id={s.id} suggestedDay={nextFree} />
            </li>
          ))}
        </ul>
      )}

      <ScheduleForm suggestedDay={nextFree} />

      <h2 className="section-title">Back catalogue {catalogue.length > 0 && <span className="chip">{catalogue.length}</span>}</h2>
      {catalogue.length === 0 ? (
        <p className="msg">Approved albums without a date wait here until you schedule them.</p>
      ) : (
        <ul className="list">
          {catalogue.map((a) => (
            <li className="admin-item" key={a.id}>
              <div className="item">
                <div className="thumb"><Sleeve album={a} /></div>
                <div className="main">
                  <div className="d">{a.profiles?.display_name ? `Suggested by ${a.profiles.display_name}` : "Added by you"}</div>
                  <div className="t">{a.title}</div>
                  <div className="a">{a.artist}{a.release_year ? ` · ${a.release_year}` : ""}{a.top_song ? ` · ${a.top_song}` : ""}</div>
                </div>
              </div>
              <CatalogueActions albumId={a.id} suggestedDay={nextFree} />
            </li>
          ))}
        </ul>
      )}

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
