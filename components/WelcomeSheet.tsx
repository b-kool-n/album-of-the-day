"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SEEN_KEY = "welcome_seen";
// Pages where the welcome would get in the way.
const QUIET = ["/login", "/terms", "/privacy", "/support", "/account/password"];

// The first time someone visits without an account. Slides up from the bottom and covers
// no more than about half the screen.
export function WelcomeSheet() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Show it; worst case it shows again next visit.
    }
    // Browser storage is only readable after the page loads, so this can't be worked out earlier.
    if (!seen) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Only a convenience.
    }
    setOpen(false);
  }

  if (!open || QUIET.some((p) => path.startsWith(p))) return null;
  return (
    <div className="sheet-wrap">
      <button className="sheet-dim" type="button" aria-label="Close" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <div className="eyebrow">Welcome</div>
        <h2 id="welcome-title">One album a day</h2>
        <p className="msg">
          Listen to today&apos;s album start to finish, then score it. Make an account to score it and see how everyone else rated it.
        </p>
        <div className="sheet-buttons">
          <Link className="btn orange" href="/login?mode=signup" onClick={close}>Make an account</Link>
          <button className="btn ghost" type="button" onClick={close}>Look around first</button>
          <Link href="/login" onClick={close}>I already have an account</Link>
        </div>
      </div>
    </div>
  );
}
