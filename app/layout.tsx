import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { Tour } from "@/components/Tour";
import { getViewer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Album of the Day",
  description: "One album a day. Listen start to finish, score it, compare with everyone else.",
  icons: { icon: "/icon.svg" },
  // iPhone: open full screen from the home screen, with a black status bar.
  appleWebApp: { capable: true, title: "Album of the Day", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await getViewer();
  // For the curator: suggestions, reported comments and new feedback waiting.
  let waiting = 0;
  if (profile?.is_admin) {
    const counts = await Promise.all([
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("comments").select("id", { count: "exact", head: true }).gt("report_count", 0),
      supabase.from("feedback").select("id", { count: "exact", head: true }).eq("handled", false),
    ]);
    waiting = counts.reduce((n, c) => n + (c.count ?? 0), 0);
  }
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Mono:wght@400;600&display=swap"
        />
      </head>
      <body>
        <header className="top">
          <div className="top-inner">
            <div className="brand-row">
              <Link href="/" className="brand">
                <Logo />
                <span className="wordmark">Album of the Day</span>
              </Link>
              <div className="who">
                {profile ? (
                  <Link href="/account" className="account-link" data-tour="account">Account</Link>
                ) : (
                  <Link href="/login" className="account-link">Sign in</Link>
                )}
              </div>
            </div>
            <Nav isAdmin={!!profile?.is_admin} adminCount={waiting} />
          </div>
        </header>
        <main className="wrap">{children}</main>
        {profile && !profile.tour_seen && <Tour />}
      </body>
    </html>
  );
}
