import Link from "next/link";
import { Disc } from "./Logo";

// In place of something that needs an account, such as scoring or comments.
export function JoinPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <p className="msg">{body}</p>
      <div className="join-row">
        <Link className="btn orange small" href="/login?mode=signup">Make an account</Link>
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}

// A whole page that needs an account: Your scores, Suggest and Account.
export function JoinPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <Disc />
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="join-col">
        <Link className="btn orange" href="/login?mode=signup">Make an account</Link>
        <Link href="/login">I already have an account</Link>
      </div>
    </div>
  );
}
