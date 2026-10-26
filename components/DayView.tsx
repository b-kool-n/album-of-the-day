import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatDay, ukToday } from "@/lib/dates";
import { MEASURES, isTopSong, oneDecimal, spotifyLink, trackLength, trackLink, type Album, type DayAverages, type Rating } from "@/lib/types";
import { Sleeve } from "./Sleeve";
import { Disc } from "./Logo";
import { ScoreForm } from "./ScoreForm";
import { Comments } from "./Comments";
import { JoinPanel } from "./Join";

export async function DayView({ day }: { day: string }) {
  const { supabase, userId, profile } = await getViewer();
  const today = ukToday();
  const isToday = day === today;

  const { data: dayRow } = await supabase.from("album_days").select("day, albums(*, profiles!albums_suggested_by_fkey(display_name))").eq("day", day).maybeSingle();
  const album = (dayRow?.albums ?? null) as unknown as (Album & { profiles: { display_name: string } | null }) | null;

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
          {album.profiles?.display_name && <span>Suggested by <b>{album.profiles.display_name}</b></span>}
        </div>
        <a className="listen" href={spotifyLink(album)} target="_blank" rel="noopener noreferrer">
          {/* Spotify's official icon (Simple Icons), in black as Spotify's brand rules allow on a coloured button. */}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#000" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Listen on Spotify
        </a>
        <div className="hint">Play it start to finish, then come back and score it.</div>
      </div>

      {album.tracks?.length > 0 && (
        <details className="panel tracklist">
          <summary>
            <h2>Tracklist</h2>
            <span className="msg">{album.tracks.length} songs · {Math.round(album.tracks.reduce((a, t) => a + t.duration_ms, 0) / 60000)} min</span>
          </summary>
          <ol>
            {album.tracks.map((t) => {
              const top = isTopSong(album, t);
              return (
                <li key={`${t.number}-${t.name}`} className={top ? "top" : undefined}>
                  <a href={trackLink(album, t)} target="_blank" rel="noopener noreferrer">
                    <span className="n num">{t.number}</span>
                    <span className="nm">{t.name}{top && <span className="chip hot">Most played</span>}</span>
                    <span className="len num">{trackLength(t.duration_ms)}</span>
                  </a>
                </li>
              );
            })}
          </ol>
          <p className="hint">Tap a song to play it in Spotify.</p>
        </details>
      )}

      {!userId ? (
        <JoinPanel title="Score it" body={`Make an account to score ${isToday ? "today's album" : "this album"} and see how everyone else rated it.`} />
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

      <Comments day={day} hasScored={!!mine} />
    </>
  );
}

async function Results({ day, mine, isToday }: { day: string; mine: Rating; isToday: boolean }) {
  const { supabase, userId } = await getViewer();
  const [{ data: avgRow }, { data: noteRows }, { data: blockRows }] = await Promise.all([
    supabase.from("day_averages").select("*").eq("day", day).maybeSingle(),
    supabase
      .from("ratings")
      .select("user_id, note, overall, updated_at, profiles(display_name)")
      .eq("day", day)
      .neq("user_id", userId!)
      .not("note", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase.from("user_blocks").select("blocked_id"),
  ]);
  const avg = avgRow as DayAverages | null;
  // Notes from people you've blocked are left out.
  const blocked = new Set((blockRows ?? []).map((b) => b.blocked_id as string));
  const notes = ((noteRows ?? []) as unknown as { user_id: string; note: string; overall: number; profiles: { display_name: string } | null }[]).filter((n) => !blocked.has(n.user_id));
  const n = avg?.ratings ?? 1;

  return (
    <div className="panel" id="results">
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
