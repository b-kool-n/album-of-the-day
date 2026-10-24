import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatWhen } from "@/lib/dates";
import { deleteComment, reportComment, toggleReaction } from "@/app/actions";

const EMOJI = ["🔥", "❤️", "😂", "👍"] as const;
const EMOJI_NAMES: Record<string, string> = { "🔥": "Fire", "❤️": "Love", "😂": "Laughing", "👍": "Thumbs up" };
import { CommentForm } from "./CommentForm";

type Comment = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  hidden: boolean;
  profiles: { display_name: string } | null;
};

export async function Comments({ day, hasScored }: { day: string; hasScored: boolean }) {
  const { supabase, userId, profile } = await getViewer();

  if (!userId) {
    return (
      <div className="panel">
        <h2>Comments</h2>
        <p className="msg"><Link href="/login">Sign in</Link> to read the comments and join in.</p>
      </div>
    );
  }

  const [{ data }, { data: myReports }, { data: reactionRows }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, user_id, body, created_at, hidden, profiles!comments_user_id_fkey(display_name)")
      .eq("day", day)
      .order("created_at", { ascending: true })
      .limit(300),
    supabase.from("comment_reports").select("comment_id").eq("reporter_id", userId),
    // Reactions for this day's comments (the database only returns ones on comments you can see).
    supabase.from("comment_reactions").select("comment_id, user_id, emoji, comments!inner(day)").eq("comments.day", day),
  ]);
  const reactions = (reactionRows ?? []) as unknown as { comment_id: string; user_id: string; emoji: string }[];
  const comments = (data ?? []) as unknown as Comment[];
  const reported = new Set((myReports ?? []).map((r) => r.comment_id as string));
  const n = comments.length;

  const list = (
    <ol className="comments">
      {comments.map((c) => {
        const mine = c.user_id === userId;
        const canDelete = mine || profile?.is_admin;
        return (
          <li className={`comment${c.hidden ? " is-hidden" : ""}`} key={c.id}>
            <div className="by">
              <span className="who-name">{c.profiles?.display_name || "Someone"}{mine ? " (you)" : ""}</span>
              <time dateTime={c.created_at}>{formatWhen(c.created_at)}</time>
            </div>
            {c.hidden && <p className="msg">Hidden from others after reports, until the curator reviews it.</p>}
            <p>{c.body}</p>
            <div className="reactions">
              {EMOJI.map((e) => {
                const these = reactions.filter((r) => r.comment_id === c.id && r.emoji === e);
                const on = these.some((r) => r.user_id === userId);
                return (
                  <form action={toggleReaction} key={e}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="day" value={day} />
                    <input type="hidden" name="emoji" value={e} />
                    <button
                      type="submit"
                      className={`reaction${on ? " on" : ""}`}
                      aria-pressed={on}
                      aria-label={`${EMOJI_NAMES[e]}, ${these.length}`}
                      disabled={!!profile?.is_blocked}
                    >
                      <span aria-hidden="true">{e}</span>
                      {these.length > 0 && <span className="num">{these.length}</span>}
                    </button>
                  </form>
                );
              })}
            </div>
            <div className="comment-actions">
              {canDelete && (
                <details className="edit">
                  <summary>Delete</summary>
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="day" value={day} />
                    <button className="btn ghost small" type="submit">Yes, delete this comment</button>
                  </form>
                </details>
              )}
              {!mine &&
                (reported.has(c.id) ? (
                  <span className="msg small">Reported. Thanks.</span>
                ) : (
                  <details className="edit">
                    <summary>Report</summary>
                    <form action={reportComment}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="day" value={day} />
                      <label className="msg" htmlFor={`rep-${c.id}`}>What&apos;s wrong with it? <span>(optional)</span></label>
                      <input className="input" id={`rep-${c.id}`} name="reason" maxLength={200} />
                      <div className="inline"><button className="btn ghost small" type="submit">Send report</button></div>
                    </form>
                  </details>
                ))}
            </div>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="panel">
      <h2>Comments{n > 0 && <span className="msg num"> · {n}</span>}</h2>
      {n === 0 ? (
        <p className="msg">No comments yet. Start the conversation.</p>
      ) : hasScored ? (
        list
      ) : (
        // Kept closed until you've scored, so other people's opinions don't sway yours.
        <details className="spoiler">
          <summary>Show {n} {n === 1 ? "comment" : "comments"}</summary>
          <p className="msg">You haven&apos;t scored this yet. Comments might sway you.</p>
          {list}
        </details>
      )}
      {profile?.is_blocked ? (
        <p className="msg" style={{ marginTop: 16 }}>Your account can&apos;t post comments at the moment.</p>
      ) : (
        <CommentForm day={day} />
      )}
    </div>
  );
}
