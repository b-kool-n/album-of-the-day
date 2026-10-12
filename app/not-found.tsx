import Link from "next/link";
import { Disc } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="empty">
      <Disc />
      <h2>Nothing here</h2>
      <p>That page doesn&apos;t exist, or that day&apos;s album hasn&apos;t been released yet.</p>
      <Link className="btn orange" href="/">Go to today&apos;s album</Link>
    </div>
  );
}
