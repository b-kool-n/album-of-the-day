"use client";

import { useActionState } from "react";
import {
  approveSubmission,
  rejectSubmission,
  removeDay,
  removeFromCatalogue,
  scheduleAlbum,
  scheduleFromCatalogue,
  updateDay,
  type AdminState,
} from "./actions";

function Status({ state }: { state: AdminState }) {
  if (state.error) return <p className="msg err" role="alert">{state.error}</p>;
  if (state.done) return <p className="msg ok" role="status">{state.done}</p>;
  return null;
}

export function ScheduleForm({ suggestedDay }: { suggestedDay: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(scheduleAlbum, {});
  return (
    <form className="panel" action={action}>
      <h2>Add an album</h2>
      <div className="sub">
        Paste the album&apos;s Spotify link. The cover, year and tracks come from Spotify, and the most-played song from Last.fm.
        Leave the date empty to put it in the back catalogue.
      </div>
      <div className="form-grid">
        <div>
          <label className="field-label" htmlFor="new-day">Date <span className="msg">(optional)</span></label>
          <input className="input" id="new-day" name="day" type="date" defaultValue={suggestedDay} />
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
        <button className="btn orange" type="submit" disabled={pending}>{pending ? "Looking it up…" : "Add album"}</button>
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
          <label className="inline msg"><input type="checkbox" name="confirm" /> Yes, clear this date (the album goes back to the back catalogue)</label>
          <div className="inline"><button className="btn ghost small" type="submit" disabled={rmPending}>Clear date</button></div>
          <Status state={rmState} />
        </form>
      )}
    </details>
  );
}

export function ReviewSubmission({ id, suggestedDay }: { id: string; suggestedDay: string }) {
  const [okState, approve, approving] = useActionState<AdminState, FormData>(approveSubmission, {});
  const [noState, reject, rejecting] = useActionState<AdminState, FormData>(rejectSubmission, {});
  return (
    <div className="review">
      <form action={approve} className="review-row">
        <input type="hidden" name="id" value={id} />
        <label className="msg" htmlFor={`ok-day-${id}`}>Date <span>(optional)</span></label>
        <input className="input" id={`ok-day-${id}`} name="day" type="date" placeholder={suggestedDay} />
        <button className="btn orange small" type="submit" disabled={approving}>{approving ? "Adding…" : "Approve"}</button>
      </form>
      <Status state={okState} />
      <details className="edit">
        <summary>Turn down</summary>
        <form action={reject}>
          <input type="hidden" name="id" value={id} />
          <label className="msg" htmlFor={`no-note-${id}`}>Reason <span>(optional, they&apos;ll see it)</span></label>
          <input className="input" id={`no-note-${id}`} name="note" maxLength={280} />
          <div className="inline"><button className="btn ghost small" type="submit" disabled={rejecting}>Turn down</button></div>
          <Status state={noState} />
        </form>
      </details>
    </div>
  );
}

export function CatalogueActions({ albumId, suggestedDay }: { albumId: string; suggestedDay: string }) {
  const [state, schedule, scheduling] = useActionState<AdminState, FormData>(scheduleFromCatalogue, {});
  const [rmState, remove, removing] = useActionState<AdminState, FormData>(removeFromCatalogue, {});
  return (
    <div className="review">
      <form action={schedule} className="review-row">
        <input type="hidden" name="album_id" value={albumId} />
        <label className="msg" htmlFor={`cat-day-${albumId}`}>Date</label>
        <input className="input" id={`cat-day-${albumId}`} name="day" type="date" defaultValue={suggestedDay} required />
        <button className="btn small" type="submit" disabled={scheduling}>{scheduling ? "Scheduling…" : "Schedule"}</button>
      </form>
      <Status state={state} />
      <details className="edit">
        <summary>Remove</summary>
        <form action={remove}>
          <input type="hidden" name="album_id" value={albumId} />
          <label className="inline msg"><input type="checkbox" name="confirm" /> Yes, remove this album</label>
          <div className="inline"><button className="btn ghost small" type="submit" disabled={removing}>Remove</button></div>
          <Status state={rmState} />
        </form>
      </details>
    </div>
  );
}
