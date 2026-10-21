"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { markTourSeen } from "@/app/account/actions";

const STEPS = [
  {
    target: "today",
    title: "Today",
    body: "Score today's album here and see how your ratings compare with the rest of the world. You can comment too, but keep it clean.",
  },
  {
    target: "me",
    title: "Your scores",
    body: "Look back on everything you've scored and find albums to relisten. Recommendations are coming in a future release.",
  },
  { target: "archive", title: "Archive", body: "Browse every past Album of the Day." },
  { target: "suggest", title: "Suggest", body: "Add your suggestions for future Albums of the Day." },
  {
    target: "account",
    title: "Account",
    body: "See your account overview, choose your notification settings, leave feedback and manage your account.",
  },
] as const;

type Box = { top: number; left: number; width: number; height: number };

// First-visit tour: dims the page, spotlights each tab in turn and explains it.
export function Tour() {
  const path = usePathname();
  const [open, setOpen] = useState(true);
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const next = useRef<HTMLButtonElement>(null);
  const step = STEPS[i];
  const active = open && path === "/";

  const measure = useCallback(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return setBox(null);
    const r = el.getBoundingClientRect();
    setBox({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
  }, [step.target]);

  useLayoutEffect(() => {
    if (!active) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    // Tabs further along may be scrolled out of view in the tab bar on a phone.
    el?.scrollIntoView({ block: "nearest", inline: "center" });
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [active, step.target, measure]);

  useEffect(() => {
    if (!active) return;
    next.current?.focus();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure, i]);

  const finish = useCallback(() => {
    setOpen(false);
    markTourSeen();
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  if (!active) return null;
  const last = i === STEPS.length - 1;
  const cardTop = box ? box.top + box.height + 14 : 120;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      <div className="tour-block" />
      {box ? (
        <div className="tour-spot" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div className="tour-card" style={{ top: cardTop }}>
        {i === 0 && <div className="eyebrow">Welcome to Album of the Day</div>}
        <h2 id="tour-title">{step.title}</h2>
        <p id="tour-body">{step.body}</p>
        <div className="tour-foot">
          <span className="msg num">{i + 1} of {STEPS.length}</span>
          <div className="inline">
            {i === 0 ? (
              <button className="linkbtn" type="button" onClick={finish}>Skip tour</button>
            ) : (
              <button className="btn ghost small" type="button" onClick={() => setI(i - 1)}>Back</button>
            )}
            <button ref={next} className="btn orange small" type="button" onClick={() => (last ? finish() : setI(i + 1))}>
              {last ? "Start listening" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
