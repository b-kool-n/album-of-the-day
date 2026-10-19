"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav({ isAdmin, pendingSuggestions = 0 }: { isAdmin: boolean; pendingSuggestions?: number }) {
  const path = usePathname();
  const tabs = [
    { href: "/", label: "Today", active: path === "/" },
    { href: "/me", label: "Your scores", active: path.startsWith("/me") },
    { href: "/archive", label: "Archive", active: path.startsWith("/archive") || path.startsWith("/day") },
    { href: "/suggest", label: "Suggest", active: path.startsWith("/suggest") },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", active: path.startsWith("/admin") }] : []),
  ];
  return (
    <nav className="tabs" aria-label="Sections">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className="tab" aria-current={t.active ? "page" : undefined}>
          {t.label}
          {t.href === "/admin" && pendingSuggestions > 0 && (
            <span className="tab-count" aria-label={`${pendingSuggestions} suggestions waiting`}>{pendingSuggestions}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
