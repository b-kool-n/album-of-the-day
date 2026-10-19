import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatWhen } from "@/lib/dates";
import { deleteComment } from "@/app/actions";
import { CommentForm } from "./CommentForm";

type Comment = { id: string; user_id: string; body: string; created_at: string; profiles: { display_name: string } | null };

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

  const { data } = await supabase
    .from("comments")
    .select("id, user_id, body, created_at, profiles!comments_user_id_fkey(display_name)")
    .eq("day", day)
    .order("created_at", { ascending: true })
    .limit(300);
  const comments = (data ?? []) as unknown as Comment[];
  const n = comments.length;

  const list = (
    <ol className="comments">
      {comments.map((c) => {
        const canDelete = c.user_id === userId || profile?.is_admin;
        return (
          <li className="comment" key={c.id}>
            <div className="by">
              <span className="who-name">{c.profiles?.display_name || "Someone"}{c.user_id === userId ? " (you)" : ""}</span>
              <time dateTime={c.created_at}>{formatWhen(c.created_at)}</time>
            </div>
            <p>{c.body}</p>
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
      <CommentForm day={day} />
    </div>
  );
}
