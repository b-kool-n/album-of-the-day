import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatDay, ukToday } from "@/lib/dates";
import { shortTitle, oneDecimal, type Album, type DayAverages } from "@/lib/types";
import { Sleeve } from "@/components/Sleeve";
import { Disc } from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Archive · Album of the Day" };

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  const top = sort === "top";
  const { supabase, userId } = await getViewer();
  const today = ukToday();
  const [{ data: days }, { data: counts }, { data: avgs }, { data: mine }, { data: pastAvgs }] = await Promise.all([
    supabase.from("album_days").select("day, albums(artist, title, release_year, cover_url)").lte("day", today).order("day", { ascending: false }),
    supabase.rpc("released_day_counts"),
    userId ? supabase.from("day_averages").select("day, overall") : Promise.resolve({ data: [] }),
    userId ? supabase.from("ratings").select("day, overall").eq("user_id", userId) : Promise.resolve({ data: [] }),
    supabase.rpc("archive_averages"),
  ]);

  const rows = (days ?? []) as unknown as { day: string; albums: Pick<Album, "artist" | "title" | "release_year" | "cover_url"> }[];
  if (!rows.length) {
    return <div className="empty"><Disc /><h2>No albums yet</h2><p>Past albums appear here once the first day has run.</p></div>;
  }
  const countBy = new Map(((counts ?? []) as { day: string; ratings: number }[]).map((c) => [c.day, c.ratings]));
  // Everyone's average for past albums; today's only once you've scored it.
  const avgBy = new Map<string, number>([
    ...((pastAvgs ?? []) as { day: string; overall: number }[]).map((a) => [a.day, Number(a.overall)] as [string, number]),
    ...((avgs ?? []) as Pick<DayAverages, "day" | "overall">[]).filter((a) => a.day === today).map((a) => [a.day, a.overall] as [string, number]),
  ]);
  const mineBy = new Map(((mine ?? []) as { day: string; overall: number }[]).map((r) => [r.day, r.overall]));
  const total = rows.length;
  const numbered = rows.map((r, i) => ({ ...r, no: total - i }));
  // Top rated: highest average first, more scores breaking ties. Albums without an average go last.
  const shown = top
    ? [...numbered].sort((a, b) => {
        const x = avgBy.get(a.day), y = avgBy.get(b.day);
        if (x == null || y == null) return x == null && y == null ? 0 : x == null ? 1 : -1;
        return y - x || (countBy.get(b.day) ?? 0) - (countBy.get(a.day) ?? 0);
      })
    : numbered;

  return (
    <>
      <p className="msg" style={{ marginTop: 20 }}>Every album so far. Missed one? Open it to listen and add a late score.</p>
      <nav className="sort-row" aria-label="Sort the archive">
        <Link href="/archive" aria-current={top ? undefined : "page"}>Newest</Link>
        <Link href="/archive?sort=top" aria-current={top ? "page" : undefined}>Top rated</Link>
      </nav>
      {top && <p className="msg">Highest average score first. Today&apos;s album joins once you&apos;ve scored it.</p>}
      <ul className="list">
        {shown.map((r) => {
          const n = countBy.get(r.day) ?? 0;
          const me = mineBy.get(r.day);
          const avg = avgBy.get(r.day);
          return (
            <li className="item" key={r.day}>
              <Link className="rowlink" href={r.day === today ? "/" : `/day/${r.day}`}>
                <div className="thumb"><Sleeve album={r.albums} /></div>
                <div className="main">
                  <div className="d">No. {r.no} · {formatDay(r.day)} {r.day === today && <span className="chip hot">Today</span>}</div>
                  <div className="t" title={r.albums.title}>{shortTitle(r.albums.title)}</div>
                  <div className="a">{r.albums.artist}{r.albums.release_year ? <> · <span className="num">{r.albums.release_year}</span></> : null}</div>
                </div>
                <div className="right">
                  {avg != null && <div className="ov">{oneDecimal(avg)}</div>}
                  <div className="d">{n ? `${n} scored` : "No scores yet"}{me != null && <> · you {oneDecimal(me)}</>}</div>
                  {me == null && userId && <span className="chip hot">Score it</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
