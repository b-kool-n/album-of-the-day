"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { suggestAlbum, type SuggestState } from "./actions";

export function SuggestForm() {
  const [state, action, pending] = useActionState<SuggestState, FormData>(suggestAlbum, {});
  const [reason, setReason] = useState("");
  const form = useRef<HTMLFormElement>(null);

  // Clear the form after a successful suggestion.
  useEffect(() => {
    if (state.at) {
      form.current?.reset();
      setReason("");
    }
  }, [state.at]);

  return (
    <form className="panel" action={action} ref={form}>
      <h2>Suggest an album</h2>
      <div className="sub">The curator reviews every suggestion. If it&apos;s picked, it goes into the back catalogue and you&apos;re credited on the day it plays.</div>
      <label className="field-label" htmlFor="sg-link">Spotify album link</label>
      <input className="input" id="sg-link" name="link" type="url" placeholder="https://open.spotify.com/album/…" required />
      <p className="hint">In Spotify, open the album, then Share → Copy link to album.</p>
      <label className="field-label" htmlFor="sg-reason">Why this one? <span className="msg">(optional)</span></label>
      <textarea
        id="sg-reason"
        name="reason"
        maxLength={280}
        placeholder="A front-to-back classic, a hidden gem, the one that got you into the band…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="count">{reason.length}/280</div>
      <div className="submit-row">
        <span />
        <button className="btn orange" type="submit" disabled={pending}>{pending ? "Looking it up…" : "Send suggestion"}</button>
      </div>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      {state.done && <p className="msg ok" role="status">{state.done}</p>}
    </form>
  );
}
