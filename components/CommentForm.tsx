"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { postComment, type CommentState } from "@/app/actions";

export function CommentForm({ day }: { day: string }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(postComment, {});
  const [body, setBody] = useState("");
  const form = useRef<HTMLFormElement>(null);

  // Clear the box once a comment has posted.
  useEffect(() => {
    if (state.at) {
      form.current?.reset();
      setBody("");
    }
  }, [state.at]);

  return (
    <form className="comment-form" action={action} ref={form}>
      <input type="hidden" name="day" value={day} />
      <label className="field-label" htmlFor={`c-body-${day}`}>Add a comment</label>
      <textarea
        id={`c-body-${day}`}
        name="body"
        maxLength={1000}
        placeholder="Favourite track? Better on the second listen? Say it here."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />
      <div className="submit-row">
        <span className="count">{body.length}/1000</span>
        <button className="btn orange small" type="submit" disabled={pending || !body.trim()}>{pending ? "Posting…" : "Post"}</button>
      </div>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
    </form>
  );
}
