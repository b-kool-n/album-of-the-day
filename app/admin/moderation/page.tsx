import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { formatDay, formatWhen, ukToday } from "@/lib/dates";
import { AdminNav } from "../AdminNav";
import { addBannedWord, keepComment, removeBannedWord, removeComment, setBlocked, setFeedbackHandled } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation · Album of the Day" };

type Reported = {
  id: string;
  day: string;
  body: string;
  hidden: boolean;
  report_count: number;
  created_at: string;
  user_id: string;
  author: { display_name: string; is_blocked: boolean } | null;
  comment_reports: { reason: string | null; reporter: { display_name: string } | null }[];
};
type Person = { id: string; display_name: string; is_admin: boolean; is_blocked: boolean; created_at: string };
type Feedback = { id: string; body: string; handled: boolean; created_at: string; contact_email: string | null; profiles: { display_name: string } | null };

export default async function ModerationPage() {
  const { supabase, profile } = await getViewer();
  if (!profile?.is_admin) redirect("/");

  const [{ data: rep }, { data: ppl }, { data: words }, { data: fb }, { count: pendingSuggestions }] = await Promise.all([
    supabase
      .from("comments")
      .select(
        "id, day, body, hidden, report_count, created_at, user_id, author:profiles!comments_user_id_fkey(display_name, is_blocked), comment_reports!comment_reports_comment_id_fkey(reason, reporter:profiles!comment_reports_reporter_id_fkey(display_name))",
      )
      .gt("report_count", 0)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, is_admin, is_blocked, created_at").order("display_name"),
    supabase.from("banned_words").select("word").order("word"),
    supabase
      .from("feedback")
      .select("id, body, handled, created_at, contact_email, profiles!feedback_user_id_fkey(display_name)")
      .order("handled", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const reported = (rep ?? []) as unknown as Reported[];
  const people = (ppl ?? []) as Person[];
  const feedback = (fb ?? []) as unknown as Feedback[];
  const newFeedback = feedback.filter((f) => !f.handled).length;
  const today = ukToday();

  return (
    <>
      <AdminNav current="moderation" albumsCount={pendingSuggestions ?? 0} moderationCount={reported.length + newFeedback} />

      <h2 className="section-title">Reported comments {reported.length > 0 && <span className="chip hot">{reported.length}</span>}</h2>
      {reported.length === 0 ? (
        <p className="msg">Nothing reported. Comments reported twice are hidden automatically until you review them here.</p>
      ) : (
        <ul className="list">
          {reported.map((c) => (
            <li className="admin-item" key={c.id}>
              <div className="d">
                {c.author?.display_name || "Someone"} on{" "}
                <Link href={c.day === today ? "/" : `/day/${c.day}`}>{formatDay(c.day)}</Link> · {formatWhen(c.created_at)}{" "}
                {c.hidden ? <span className="chip hot">Hidden</span> : <span className="chip">Visible</span>}{" "}
                <span className="chip">{c.report_count} {c.report_count === 1 ? "report" : "reports"}</span>
              </div>
              <p className="quote">{c.body}</p>
              {c.comment_reports.length > 0 && (
                <ul className="reasons">
                  {c.comment_reports.map((r, i) => (
                    <li key={i}>{r.reporter?.display_name || "Someone"}: {r.reason || <span className="msg">no reason given</span>}</li>
                  ))}
                </ul>
              )}
              <div className="inline">
                <form action={keepComment}><input type="hidden" name="id" value={c.id} /><button className="btn small" type="submit">Keep it</button></form>
                <form action={removeComment}><input type="hidden" name="id" value={c.id} /><button className="btn ghost small" type="submit">Delete comment</button></form>
                {!c.author?.is_blocked && (
                  <form action={setBlocked}>
                    <input type="hidden" name="user_id" value={c.user_id} />
                    <input type="hidden" name="blocked" value="true" />
                    <button className="btn ghost small" type="submit">Block {c.author?.display_name || "author"}</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">Feedback {newFeedback > 0 && <span className="chip hot">{newFeedback} new</span>}</h2>
      {feedback.length === 0 ? (
        <p className="msg">No feedback yet. People send it from their Account page or the Help and support page.</p>
      ) : (
        <ul className="list">
          {feedback.map((f) => (
            <li className={`admin-item${f.handled ? " is-done" : ""}`} key={f.id}>
              <div className="d">
                {f.profiles?.display_name || (f.contact_email ? "Support page" : "Deleted account")} · {formatWhen(f.created_at)}
                {f.contact_email && <> · reply to <a href={`mailto:${f.contact_email}`}>{f.contact_email}</a></>}
              </div>
              <p className="quote">{f.body}</p>
              <form action={setFeedbackHandled} className="inline">
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="handled" value={f.handled ? "false" : "true"} />
                <button className="btn ghost small" type="submit">{f.handled ? "Mark as new" : "Mark as done"}</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">People <span className="chip">{people.length}</span></h2>
      <p className="msg">Blocked people can still sign in and score albums, but can&apos;t comment, add notes or suggest albums.</p>
      <ul className="list">
        {people.map((p) => (
          <li className="item" key={p.id}>
            <div className="main">
              <div className="t">{p.display_name}{p.is_admin && <span className="chip hot" style={{ marginLeft: 8 }}>Curator</span>}{p.is_blocked && <span className="chip" style={{ marginLeft: 8 }}>Blocked</span>}</div>
              <div className="d">Joined {formatDay(p.created_at.slice(0, 10))}</div>
            </div>
            {!p.is_admin && (
              <form action={setBlocked} className="right">
                <input type="hidden" name="user_id" value={p.id} />
                <input type="hidden" name="blocked" value={p.is_blocked ? "false" : "true"} />
                <button className="btn ghost small" type="submit">{p.is_blocked ? "Unblock" : "Block"}</button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <h2 className="section-title">Banned words</h2>
      <p className="msg">Comments, notes, suggestion reasons and names containing these words are refused. Whole words only, so &ldquo;cocoon&rdquo; isn&apos;t caught by &ldquo;coon&rdquo;. Plurals ending in s are caught too.</p>
      <form action={addBannedWord} className="review-row" style={{ marginTop: 12 }}>
        <label className="msg" htmlFor="new-word">Add a word</label>
        <input className="input" id="new-word" name="word" maxLength={40} required />
        <button className="btn small" type="submit">Add</button>
      </form>
      <details className="edit" style={{ marginTop: 12 }}>
        <summary>Show the list ({(words ?? []).length})</summary>
        <ul className="word-list">
          {(words ?? []).map((w) => (
            <li key={w.word as string}>
              <span>{w.word as string}</span>
              <form action={removeBannedWord}>
                <input type="hidden" name="word" value={w.word as string} />
                <button className="linkbtn" type="submit">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
