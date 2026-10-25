"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "signup" ? signUp : signIn, {});
  return (
    <form action={action}>
      {mode === "signup" && (
        <>
          <label className="field-label" htmlFor="name">Your name</label>
          <input className="input" id="name" name="name" autoComplete="nickname" maxLength={40} required />
        </>
      )}
      <label className="field-label" htmlFor="email">Email</label>
      <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      <label className="field-label" htmlFor="password">Password</label>
      <input
        className="input"
        id="password"
        name="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        minLength={mode === "signup" ? 8 : undefined}
        required
      />
      {mode === "signup" && (
        <label className="agree">
          <input type="checkbox" name="terms" required />
          <span>I agree to the <a href="/terms" target="_blank">terms of use</a>: no abuse, hate or nasty stuff.</span>
        </label>
      )}
      <div className="submit-row">
        <span />
        <button className="btn orange" type="submit" disabled={pending}>
          {pending ? "One moment…" : mode === "signup" ? "Make account" : "Sign in"}
        </button>
      </div>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      {state.info && <p className="msg ok" role="status">{state.info}</p>}
    </form>
  );
}
