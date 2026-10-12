import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatDay, ukToday } from "@/lib/dates";
import { MEASURES, oneDecimal, type Album, type Rating } from "@/lib/types";
import { Sleeve } from "@/components/Sleeve";
import { Disc } from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your scores · Album of the Day" };

export default async function MePage() {
  const { supabase, userId, profile } = await getViewer();
  if (!userId) {
    return (
      <div className="empty"><Disc /><h2>Your scores</h2>
        <p><Link href="/login">Sign in</Link> to keep a history of every album you score.</p></div>
    );
  }
  const { data } = await supabase
    .from("ratings")
    .select("*, album_days(albums(artist, title, cover_url))")
    .eq("user_id", userId)
    .order("day", { ascending: false });
  const rows = (data ?? []) as unknown as (Rating & { album_days: { albums: Pick<Album, "artist" | "title" | "cover_url"> } })[];

  if (!rows.length) {
    return (
      <div className="empty"><Disc /><h2>Nothing scored yet</h2>
        <p>Every album you score lands here, newest first.</p>
        <Link className="btn orange" href="/">Score today&apos;s album</Link></div>
    );
  }

  const avg = (key: "overall" | (typeof MEASURES)[number]["key"]) => {
    const v = rows.filter((r) => !(key === "nostalgia" && r.new_to_me) && r[key] != null).map((r) => Number(r[key]));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const today = ukToday();

  return (
    <>
      <p className="msg" style={{ marginTop: 20 }}>Signed in as {profile?.display_name}.</p>
      <div className="summary">
        <div className="stat"><div className="k">Albums scored</div><div className="v">{rows.length}</div></div>
        <div className="stat"><div className="k">Your average</div><div className="v">{oneDecimal(avg("overall"))}</div></div>
        <div className="stat"><div className="k">New to you</div><div className="v">{rows.filter((r) => r.new_to_me).length}</div></div>
      </div>
      <div className="measure-avgs">
        {MEASURES.map((m) => <span key={m.key}>{m.short} <b>{oneDecimal(avg(m.key))}</b></span>)}
      </div>
      <ul className="list">
        {rows.map((r) => {
          const a = r.album_days.albums;
          return (
            <li className="item" key={r.day}>
              <Link className="rowlink" href={r.day === today ? "/" : `/day/${r.day}`}>
                <div className="thumb"><Sleeve album={a} /></div>
                <div className="main">
                  <div className="t">{a.title}</div>
                  <div className="a">{a.artist}</div>
                  <div className="mini">
                    {MEASURES.map((m) => `${m.short.slice(0, 1)} ${m.key === "nostalgia" && r.new_to_me ? "–" : oneDecimal(r[m.key])}`).join(" · ")}
                  </div>
                  {r.note && <div className="note-line">{r.note}</div>}
                </div>
                <div className="right">
                  <div className="ov you">{oneDecimal(r.overall)}</div>
                  <div className="d">{formatDay(r.day)}</div>
                  {r.new_to_me && <span className="chip">New</span>} {r.late && <span className="chip">Late</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
