"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendSupport, type SupportState } from "./actions";

export function SupportForm() {
  const [state, action, pending] = useActionState<SupportState, FormData>(sendSupport, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.done) form.current?.reset();
  }, [state.done]);

  return (
    <form action={action} ref={form} className="panel">
      <label className="field-label" htmlFor="sp-email">Your email</label>
      <input className="input" id="sp-email" name="email" type="email" autoComplete="email" required maxLength={200} />
      <p className="hint">So we can reply. It isn&apos;t used for anything else.</p>
      <label className="field-label" htmlFor="sp-body">Message</label>
      <textarea id="sp-body" name="body" required maxLength={2000} />
      {/* Left empty by people; filled in by spam robots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <div className="submit-row">
        <span />
        <button className="btn orange" type="submit" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
      </div>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      {state.done && <p className="msg ok" role="status">{state.done}</p>}
    </form>
  );
}
