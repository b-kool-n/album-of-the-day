import Link from "next/link";

export function AdminNav({ current, albumsCount, moderationCount }: { current: "albums" | "moderation"; albumsCount: number; moderationCount: number }) {
  return (
    <nav className="subnav" aria-label="Admin sections">
      <Link href="/admin" aria-current={current === "albums" ? "page" : undefined}>
        Albums and suggestions{albumsCount > 0 && <span className="tab-count">{albumsCount}</span>}
      </Link>
      <Link href="/admin/moderation" aria-current={current === "moderation" ? "page" : undefined}>
        Moderation{moderationCount > 0 && <span className="tab-count">{moderationCount}</span>}
      </Link>
    </nav>
  );
}
