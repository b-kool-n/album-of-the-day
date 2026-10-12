import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { getViewer } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export const metadata: Metadata = {
  title: "Album of the Day",
  description: "One album a day. Listen start to finish, score it, compare with everyone else.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f0ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getViewer();
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
                  <form action={signOut}>
                    <button className="linkbtn" type="submit">Sign out</button>
                  </form>
                ) : (
                  <Link href="/login" className="linkbtn">Sign in</Link>
                )}
              </div>
            </div>
            <Nav isAdmin={!!profile?.is_admin} />
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
