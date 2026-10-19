"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteAccount, sendFeedback, updateName, type FormState } from "./actions";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p className="msg err" role="alert">{state.error}</p>;
  if (state.done) return <p className="msg ok" role="status">{state.done}</p>;
  return null;
}

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateName, {});
  return (
    <form action={action} className="inline-form">
      <label className="field-label" htmlFor="acc-name">Name <span className="msg">(shown on your comments and notes)</span></label>
      <div className="review-row">
        <input className="input" id="acc-name" name="name" defaultValue={name} maxLength={40} autoComplete="nickname" required />
        <button className="btn small" type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function FeedbackForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendFeedback, {});
  const [body, setBody] = useState("");
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.at) {
      form.current?.reset();
      setBody("");
    }
  }, [state.at]);
  return (
    <form action={action} ref={form}>
      <label className="field-label" htmlFor="acc-feedback">What&apos;s working, what&apos;s not, what you&apos;d like next</label>
      <textarea id="acc-feedback" name="body" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} required />
      <div className="submit-row">
        <span className="count">{body.length}/2000</span>
        <button className="btn orange small" type="submit" disabled={pending || !body.trim()}>{pending ? "Sending…" : "Send feedback"}</button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, {});
  return (
    <details className="edit danger">
      <summary>Delete my account</summary>
      <form action={action}>
        <p className="msg">
          This permanently deletes your login, your scores, notes, comments, suggestions and notification settings.
          Albums you suggested stay in the catalogue without your name. It can&apos;t be undone.
        </p>
        <label className="inline msg"><input type="checkbox" name="confirm" /> Yes, delete my account and everything in it</label>
        <div className="inline"><button className="btn danger-btn small" type="submit" disabled={pending}>{pending ? "Deleting…" : "Delete account"}</button></div>
        <Status state={state} />
      </form>
    </details>
  );
}
