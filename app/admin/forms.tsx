"use client";

import { useActionState } from "react";
import { removeDay, scheduleAlbum, updateDay, type AdminState } from "./actions";

function Status({ state }: { state: AdminState }) {
  if (state.error) return <p className="msg err" role="alert">{state.error}</p>;
  if (state.done) return <p className="msg ok" role="status">{state.done}</p>;
  return null;
}

export function ScheduleForm({ suggestedDay }: { suggestedDay: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(scheduleAlbum, {});
  return (
    <form className="panel" action={action}>
      <h2>Schedule an album</h2>
      <div className="sub">Paste the album&apos;s Spotify link. The cover, year and tracks come from Spotify, and the most-played song from Last.fm.</div>
      <div className="form-grid">
        <div>
          <label className="field-label" htmlFor="new-day">Date</label>
          <input className="input" id="new-day" name="day" type="date" defaultValue={suggestedDay} required />
        </div>
        <div className="full">
          <label className="field-label" htmlFor="new-link">Spotify album link</label>
          <input className="input" id="new-link" name="link" type="url" placeholder="https://open.spotify.com/album/…" required />
        </div>
        <div className="full">
          <label className="field-label" htmlFor="new-song">Most-played song <span className="msg">(leave blank to look it up)</span></label>
          <input className="input" id="new-song" name="top_song" />
        </div>
      </div>
      <div className="submit-row">
        <span />
        <button className="btn orange" type="submit" disabled={pending}>{pending ? "Looking it up…" : "Schedule album"}</button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function EditDay({ day, topSong, hasSpotify, canRemove }: { day: string; topSong: string | null; hasSpotify: boolean; canRemove: boolean }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateDay, {});
  const [rmState, rmAction, rmPending] = useActionState<AdminState, FormData>(removeDay, {});
  return (
    <details className="edit">
      <summary>{hasSpotify ? "Edit" : "Add Spotify link"}</summary>
      <form action={action}>
        <input type="hidden" name="day" value={day} />
        <label className="msg" htmlFor={`link-${day}`}>Spotify album link</label>
        <input className="input" id={`link-${day}`} name="link" type="url" placeholder="https://open.spotify.com/album/…" />
        <label className="msg" htmlFor={`song-${day}`}>Most-played song</label>
        <input className="input" id={`song-${day}`} name="top_song" defaultValue={topSong ?? ""} />
        <div className="inline">
          <button className="btn small" type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        </div>
        <Status state={state} />
      </form>
      {canRemove && (
        <form action={rmAction}>
          <input type="hidden" name="day" value={day} />
          <label className="inline msg"><input type="checkbox" name="confirm" /> Yes, remove this day</label>
          <div className="inline"><button className="btn ghost small" type="submit" disabled={rmPending}>Remove</button></div>
          <Status state={rmState} />
        </form>
      )}
    </details>
  );
}
