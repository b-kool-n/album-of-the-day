import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatDay, ukToday } from "@/lib/dates";
import { Sleeve } from "@/components/Sleeve";
import { SuggestForm } from "./SuggestForm";
import { withdrawSuggestion } from "./actions";
import { JoinPage } from "@/components/Join";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suggest · Album of the Day" };

type Suggestion = {
  id: string;
  artist: string;
  title: string;
  release_year: number | null;
  cover_url: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
  // Only filled in once the album has actually played; future dates stay hidden.
  albums: { album_days: { day: string }[] } | null;
};

export default async function SuggestPage() {
  const { supabase, userId } = await getViewer();
  if (!userId) {
    return (
      <JoinPage title="Suggest an album" body="Make an account to suggest albums for a future Album of the Day." />
    );
  }

  const { data } = await supabase
    .from("submissions")
    .select("id, artist, title, release_year, cover_url, reason, status, review_note, created_at, albums!submissions_album_id_fkey(album_days!album_days_album_id_fkey(day))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const mine = (data ?? []) as unknown as Suggestion[];
  const today = ukToday();

  return (
    <>
      <SuggestForm />
      <h2 className="section-title">Your suggestions</h2>
      {mine.length === 0 ? (
        <p className="msg">Nothing yet. Albums you suggest appear here with their status.</p>
      ) : (
        <ul className="list">
          {mine.map((s) => {
            const playedOn = s.albums?.album_days.map((d) => d.day).filter((d) => d <= today).sort()[0];
            return (
              <li className="item" key={s.id}>
                <div className="thumb"><Sleeve album={s} /></div>
                <div className="main">
                  <div className="d">Suggested {formatDay(s.created_at.slice(0, 10))}</div>
                  <div className="t">{s.title}</div>
                  <div className="a">{s.artist}{s.release_year ? ` · ${s.release_year}` : ""}</div>
                  {s.reason && <div className="note-line">&ldquo;{s.reason}&rdquo;</div>}
                  {s.status === "rejected" && s.review_note && <div className="note-line msg">Curator: {s.review_note}</div>}
                  {playedOn && (
                    <div className="note-line">
                      Played on <Link href={playedOn === today ? "/" : `/day/${playedOn}`}>{formatDay(playedOn)}</Link>
                    </div>
                  )}
                </div>
                <div className="right">
                  {s.status === "pending" && (
                    <>
                      <span className="chip">Waiting</span>
                      <form action={withdrawSuggestion}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="linkbtn" type="submit">Withdraw</button>
                      </form>
                    </>
                  )}
                  {s.status === "approved" && <span className="chip hot">{playedOn ? "Played" : "Added"}</span>}
                  {s.status === "rejected" && <span className="chip">Not this time</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
