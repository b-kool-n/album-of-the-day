import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatDay, ukToday } from "@/lib/dates";
import { oneDecimal, type Album, type DayAverages } from "@/lib/types";
import { Sleeve } from "@/components/Sleeve";
import { Disc } from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Archive · Album of the Day" };

export default async function ArchivePage() {
  const { supabase, userId } = await getViewer();
  const today = ukToday();
  const [{ data: days }, { data: counts }, { data: avgs }, { data: mine }] = await Promise.all([
    supabase.from("album_days").select("day, albums(artist, title, release_year, cover_url)").lte("day", today).order("day", { ascending: false }),
    supabase.rpc("released_day_counts"),
    userId ? supabase.from("day_averages").select("day, overall") : Promise.resolve({ data: [] }),
    userId ? supabase.from("ratings").select("day, overall").eq("user_id", userId) : Promise.resolve({ data: [] }),
  ]);

  const rows = (days ?? []) as unknown as { day: string; albums: Pick<Album, "artist" | "title" | "release_year" | "cover_url"> }[];
  if (!rows.length) {
    return <div className="empty"><Disc /><h2>No albums yet</h2><p>Past albums appear here once the first day has run.</p></div>;
  }
  const countBy = new Map(((counts ?? []) as { day: string; ratings: number }[]).map((c) => [c.day, c.ratings]));
  const avgBy = new Map(((avgs ?? []) as Pick<DayAverages, "day" | "overall">[]).map((a) => [a.day, a.overall]));
  const mineBy = new Map(((mine ?? []) as { day: string; overall: number }[]).map((r) => [r.day, r.overall]));
  const total = rows.length;

  return (
    <>
      <p className="msg" style={{ marginTop: 20 }}>Every album so far. Missed one? Open it to listen and add a late score.</p>
      <ul className="list">
        {rows.map((r, i) => {
          const n = countBy.get(r.day) ?? 0;
          const me = mineBy.get(r.day);
          return (
            <li className="item" key={r.day}>
              <Link className="rowlink" href={r.day === today ? "/" : `/day/${r.day}`}>
                <div className="thumb"><Sleeve album={r.albums} /></div>
                <div className="main">
                  <div className="d">No. {total - i} · {formatDay(r.day)} {r.day === today && <span className="chip hot">Today</span>}</div>
                  <div className="t">{r.albums.title}</div>
                  <div className="a">{r.albums.artist}{r.albums.release_year ? <> · <span className="num">{r.albums.release_year}</span></> : null}</div>
                </div>
                <div className="right">
                  {me != null ? (
                    <><div className="ov">{oneDecimal(avgBy.get(r.day))}</div><div className="d">{n} scored · you {oneDecimal(me)}</div></>
                  ) : (
                    <><div className="d">{n ? `${n} scored` : "No scores yet"}</div>{userId && <span className="chip hot">Score it</span>}</>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
