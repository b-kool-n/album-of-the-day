import Link from "next/link";

export const metadata = { title: "Privacy · Album of the Day" };

export default function PrivacyPage() {
  return (
    <article className="prose">
      <h1 className="page-title">Privacy policy</h1>
      <p className="msg">Last updated 25 October 2026</p>

      <p>
        Album of the Day is a small, independent app run by Benjamin Koolen in the UK. It keeps as little about you as it can,
        doesn&apos;t show adverts, doesn&apos;t sell anything about you and doesn&apos;t track you across other apps or sites.
      </p>

      <h2>What we store</h2>
      <ul>
        <li><b>Your account:</b> your email address, the name you choose, and a password (stored scrambled, so nobody can read it), plus when you agreed to the <Link href="/terms">terms of use</Link>.</li>
        <li><b>If you sign in with Apple or Google:</b> the email address and name they share with us. For Apple, we also keep a sign-in token, only so we can cancel your link with Apple if you delete your account.</li>
        <li><b>What you add:</b> your scores and notes, comments and reactions, albums you suggest, reports you make about comments, people you block, and feedback you send.</li>
        <li><b>Support messages:</b> if you use the <Link href="/support">support page</Link>, your message and the email address you give, so we can reply.</li>
        <li><b>Notifications:</b> if you turn on the daily notification, a delivery address for each device, supplied by your phone or browser.</li>
      </ul>
      <p>We don&apos;t connect to your Spotify account and don&apos;t know what you listen to. The Listen button just opens Spotify.</p>

      <h2>Who can see it</h2>
      <ul>
        <li>Other signed-in people see your name, comments, and your scores and notes for a day once they&apos;ve scored that day themselves.</li>
        <li>Your email address, suggestions, reports, feedback and devices are visible only to you and the curator who runs the app.</li>
        <li>Who you&apos;ve blocked is visible only to you. The people you block aren&apos;t told.</li>
      </ul>

      <h2>Where it&apos;s kept</h2>
      <p>
        Your data is stored by Supabase in London. The website runs on Vercel. Sign-up emails are sent by Resend. Phone
        notifications go through Expo, Apple and Google. Album details and covers come from Spotify, and play counts from
        Last.fm, but nothing about you is sent to either.
      </p>

      <h2>Deleting your data</h2>
      <p>
        You can delete your account at any time from your <Link href="/account">Account</Link> page, in the app or on the website.
        That removes your login, scores, notes, comments, reactions, suggestions, reports, blocks and devices straight away, and
        cancels any link with Apple. Albums you suggested stay in the catalogue without your name.
      </p>

      <h2>Getting in touch</h2>
      <p>
        For questions, problems or to report something, use <b>Leave feedback</b> on your <Link href="/account">Account</Link> page,
        or the <Link href="/support">support page</Link> if you can&apos;t sign in. To report a comment, use the Report link under it.
      </p>
    </article>
  );
}
