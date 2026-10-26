"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { acceptTerms } from "@/app/account/actions";

// Pages people need to be able to read before agreeing.
const READABLE = ["/terms", "/privacy", "/support"];

// Shown once to anyone who hasn't agreed to the terms yet: people who joined before the terms
// existed, and people who signed up with Apple or Google.
export function TermsPrompt() {
  const path = usePathname();
  if (READABLE.includes(path)) return null;
  return (
    <div className="sheet-wrap">
      <div className="sheet-dim" aria-hidden="true" />
      <div className="sheet terms" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        <div className="eyebrow">Before you carry on</div>
        <h2 id="terms-title">Our terms of use</h2>
        <p className="msg">Album of the Day is for talking about music. To use it, you agree to:</p>
        <ul className="msg">
          <li>no abuse, bullying, hate or threats, aimed at anyone;</li>
          <li>no sexual, violent or illegal content, and no spam;</li>
          <li>comments that break these rules being removed, and accounts being limited or closed.</li>
        </ul>
        <p className="msg" style={{ marginTop: 10 }}>
          The full version is short: <Link href="/terms">read the terms of use</Link>.
        </p>
        <form action={acceptTerms} className="inline" style={{ marginTop: 14 }}>
          <button className="btn orange" type="submit">I agree</button>
        </form>
      </div>
    </div>
  );
}
