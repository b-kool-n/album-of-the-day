import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatDay, ukToday } from "@/lib/dates";
import { MEASURES, oneDecimal, spotifyLink, type Album, type DayAverages, type Rating } from "@/lib/types";
import { Sleeve } from "./Sleeve";
import { Disc } from "./Logo";
import { ScoreForm } from "./ScoreForm";

export async function DayView({ day }: { day: string }) {
  const { supabase, userId, profile } = await getViewer();
  const today = ukToday();
  const isToday = day === today;

  const { data: dayRow } = await supabase.from("album_days").select("day, albums(*)").eq("day", day).maybeSingle();
  const album = (dayRow?.albums ?? null) as unknown as Album | null;

  if (!album || day > today) {
    return (
      <div className="empty">
        <Disc />
        <h2>No album yet</h2>
        <p>Nothing is scheduled for {formatDay(day, true)}.{profile?.is_admin ? " Add one in Admin." : " Check back later."}</p>
        {profile?.is_admin && <Link className="btn orange" href="/admin">Open Admin</Link>}
      </div>
    );
  }

  const [{ count: number }, { data: countData }, mineRes] = await Promise.all([
    supabase.from("album_days").select("day", { count: "exact", head: true }).lte("day", day),
    supabase.rpc("rating_count", { d: day }),
    userId
      ? supabase.from("ratings").select("*").eq("user_id", userId).eq("day", day).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const mine = (mineRes.data ?? null) as Rating | null;
  const ratingCount = (countData as number | null) ?? 0;
  const editable = !mine || mine.created_day === today;

  return (
    <>
      {!isToday && <Link className="back" href="/archive">← Archive</Link>}
      <div className="deck">
        <div className="sleeve-slot"><Sleeve album={album} number={number ?? undefined} /></div>
        <Disc />
      </div>
      <div className="album-meta">
        <div className="eyebrow">No. {number} · {formatDay(day)}{isToday ? " · Today" : ""}</div>
        <h1>{album.title}</h1>
        <div className="artist">{album.artist}</div>
        <div className="facts">
          {album.release_year && <span>Released <b className="num">{album.release_year}</b></span>}
          {album.top_song && <span>Most played <b>{album.top_song}</b></span>}
          {album.tracks?.length > 0 && <span><b className="num">{album.tracks.length}</b> tracks · <b className="num">{Math.round(album.tracks.reduce((a, t) => a + t.duration_ms, 0) / 60000)}</b> min</span>}
        </div>
        <a className="listen" href={spotifyLink(album)} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="currentColor" />
            <path d="M6.5 9.2c3.7-1.1 7.9-.8 11 1M7.2 12.3c3-.8 6.4-.6 9.2.9M7.9 15.2c2.4-.6 5-.4 7.2.8" stroke="var(--orange)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          Listen on Spotify
        </a>
        <div className="hint">Play it start to finish, then come back and score it.</div>
      </div>

      {!userId ? (
        <div className="panel">
          <h2>Score it</h2>
          <p className="msg"><Link href="/login">Sign in</Link> or <Link href="/login?mode=signup">make an account</Link> to add your scores.</p>
        </div>
      ) : mine && !editable ? (
        <div className="panel">
          <h2>Your scores</h2>
          <div className="sub">Scores lock at midnight UK time on the day you give them.</div>
          <div className="locked-scores">
            {MEASURES.map((m) => (
              <div className="ls" key={m.key}>
                <div className="k">{m.short}</div>
                <div className="v">{m.key === "nostalgia" && mine.new_to_me ? "–" : oneDecimal(mine[m.key])}</div>
              </div>
            ))}
          </div>
          {mine.note && <p>{mine.note}</p>}
        </div>
      ) : (
        <ScoreForm
          key={mine?.updated_at ?? "new"}
          day={day}
          isToday={isToday}
          initial={mine ? { back_to_back: mine.back_to_back, vibes: mine.vibes, nostalgia: mine.nostalgia, relisten: mine.relisten, new_to_me: mine.new_to_me, note: mine.note } : null}
        />
      )}

      {mine ? (
        <Results day={day} mine={mine} isToday={isToday} />
      ) : (
        <div className="panel">
          <h2>{isToday ? "Today's scores" : "Scores for this day"}</h2>
          <p className="msg">
            {ratingCount ? `${ratingCount} ${ratingCount === 1 ? "person has" : "people have"} scored this.` : "Nobody has scored this yet."} The averages appear once you&apos;ve given yours.
          </p>
        </div>
      )}
    </>
  );
}

async function Results({ day, mine, isToday }: { day: string; mine: Rating; isToday: boolean }) {
  const { supabase, userId } = await getViewer();
  const [{ data: avgRow }, { data: noteRows }] = await Promise.all([
    supabase.from("day_averages").select("*").eq("day", day).maybeSingle(),
    supabase
      .from("ratings")
      .select("user_id, note, overall, updated_at, profiles(display_name)")
      .eq("day", day)
      .neq("user_id", userId!)
      .not("note", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);
  const avg = avgRow as DayAverages | null;
  const notes = (noteRows ?? []) as unknown as { user_id: string; note: string; overall: number; profiles: { display_name: string } | null }[];
  const n = avg?.ratings ?? 1;

  return (
    <div className="panel">
      <div className="res-head">
        <div>
          <h2>{isToday ? "Today's scores" : "Scores for this day"}</h2>
          <div className="sub">{n} {n === 1 ? "person" : "people"} scored this</div>
        </div>
        <div className="big-pair">
          <div><span className="eyebrow">You</span><span className="n you">{oneDecimal(mine.overall)}</span></div>
          <div><span className="eyebrow">Average</span><span className="n">{oneDecimal(avg?.overall)}</span></div>
        </div>
      </div>
      <div className="bars">
        {MEASURES.map((m) => {
          const you = m.key === "nostalgia" && mine.new_to_me ? null : Number(mine[m.key]);
          const a = avg?.[m.key] == null ? null : Number(avg[m.key]);
          const knew = m.key === "nostalgia" && avg && avg.nostalgia_ratings !== avg.ratings ? ` (${avg.nostalgia_ratings} knew it)` : "";
          return (
            <div className="bar-row" key={m.key}>
              <span className="nm">{m.short}{knew && <span className="msg">{knew}</span>}</span>
              <span className="figs">you <b>{you == null ? "–" : oneDecimal(you)}</b> · avg <b>{oneDecimal(a)}</b></span>
              <div className="track" role="img" aria-label={`${m.short}: you ${you == null ? "skipped" : oneDecimal(you)}, average ${oneDecimal(a)} out of 10`}>
                {a != null && <div className="avg" style={{ width: `${a * 10}%` }} />}
                {you != null && <div className="you" style={{ left: `${you * 10}%` }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="legend"><span><i className="l-avg" />Average</span><span><i className="l-you" />You</span></div>
      {notes.length > 0 && (
        <div className="notes">
          {notes.map((x) => (
            <div className="note" key={x.user_id}>
              <div className="by"><span>{x.profiles?.display_name || "Someone"}</span><span className="ov">{oneDecimal(x.overall)}</span></div>
              <p>{x.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
