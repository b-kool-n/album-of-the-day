"use client";

import { useActionState } from "react";
import { setNewPassword, type FormState } from "../actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(setNewPassword, {});
  return (
    <form action={action}>
      <label className="field-label" htmlFor="pw">New password</label>
      <input className="input" id="pw" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <label className="field-label" htmlFor="pw2">Type it again</label>
      <input className="input" id="pw2" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      <div className="submit-row">
        <span />
        <button className="btn orange" type="submit" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
      </div>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      {state.done && <p className="msg ok" role="status">{state.done}</p>}
    </form>
  );
}
