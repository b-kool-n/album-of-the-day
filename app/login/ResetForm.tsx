"use client";

import { useActionState } from "react";
import { sendReset, type AuthState } from "./actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(sendReset, {});
  return (
    <form action={action}>
      <label className="field-label" htmlFor="email">Email</label>
      <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      <div className="submit-row">
        <span />
        <button className="btn orange" type="submit" disabled={pending}>{pending ? "Sending…" : "Send me a link"}</button>
      </div>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      {state.info && <p className="msg ok" role="status">{state.info}</p>}
    </form>
  );
}
