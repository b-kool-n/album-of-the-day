"use client";

import { useActionState, useState } from "react";
import { saveScores, type ScoreState } from "@/app/actions";
import { MEASURES, oneDecimal, type MeasureKey } from "@/lib/types";

type Initial = Record<MeasureKey, number | null> & { new_to_me: boolean; note: string | null };

export function ScoreForm({ day, initial, isToday }: { day: string; initial: Initial | null; isToday: boolean }) {
  const [state, action, pending] = useActionState<ScoreState, FormData>(saveScores, {});
  const [values, setValues] = useState<Record<MeasureKey, number>>({
    back_to_back: initial?.back_to_back ?? 5,
    vibes: initial?.vibes ?? 5,
    nostalgia: initial?.nostalgia ?? 5,
    relisten: initial?.relisten ?? 5,
  });
  const [newToMe, setNewToMe] = useState(initial?.new_to_me ?? false);
  const [note, setNote] = useState(initial?.note ?? "");

  const counted = MEASURES.filter((m) => !(m.key === "nostalgia" && newToMe)).map((m) => values[m.key]);
  const overall = Math.round((counted.reduce((a, b) => a + b, 0) / counted.length) * 10) / 10;

  return (
    <form className="panel" action={action}>
      <h2>{initial ? "Change your scores" : "Score it"}</h2>
      <div className="sub">
        {initial
          ? "You can change these until midnight UK time."
          : isToday
            ? "Out of 10, in half points."
            : "Late score for a past day. Out of 10, in half points."}
      </div>
      <input type="hidden" name="day" value={day} />

      <div className="switch">
        <div className="txt" id="new-label">
          New to me
          <small>Turn on if you hadn&apos;t heard it before. Nostalgia is left out.</small>
        </div>
        <label className="toggle">
          <input type="checkbox" name="new_to_me" aria-labelledby="new-label" checked={newToMe} onChange={(e) => setNewToMe(e.target.checked)} />
          <span />
        </label>
      </div>

      {MEASURES.map((m) => {
        const off = m.key === "nostalgia" && newToMe;
        return (
          <div className={`score-row${off ? " off" : ""}`} key={m.key}>
            <label htmlFor={`s-${m.key}`}>{m.name}</label>
            <output className="val" htmlFor={`s-${m.key}`}>{off ? "–" : oneDecimal(values[m.key])}</output>
            <div className="q">{m.question}</div>
            <input
              type="range"
              id={`s-${m.key}`}
              name={m.key}
              min={0}
              max={10}
              step={0.5}
              value={values[m.key]}
              disabled={off}
              onChange={(e) => setValues((v) => ({ ...v, [m.key]: Number(e.target.value) }))}
            />
          </div>
        );
      })}

      <label className="field-label" htmlFor="s-note">
        Note <span className="msg">(optional)</span>
      </label>
      <textarea
        id="s-note"
        name="note"
        maxLength={500}
        placeholder="Carried by one track? Better than you remembered?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="count">{note.length}/500</div>

      <div className="submit-row">
        <div className="overall-preview">
          <span className="big">{oneDecimal(overall)}</span>
          <span className="msg">overall</span>
        </div>
        <button className="btn orange" type="submit" disabled={pending}>
          {pending ? "Saving…" : initial ? "Update scores" : "Save scores"}
        </button>
      </div>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      {state.saved && <p className="msg ok" role="status">Saved.</p>}
    </form>
  );
}
