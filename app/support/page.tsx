import Link from "next/link";
import { SupportForm } from "./SupportForm";

export const metadata = { title: "Help and support · Album of the Day" };

// The support page for the App Store listing. The contact form works without an account.
export default function SupportPage() {
  return (
    <article className="prose">
      <h1 className="page-title">Help and support</h1>

      <h2>How it works</h2>
      <p>
        Every day at midnight (UK time) there&apos;s a new album. Listen to it start to finish on Spotify, then score it out of 10
        on four things. Once you&apos;ve scored, you see how everyone else rated it. Scores can be changed until midnight.
      </p>

      <h2>Common questions</h2>
      <ul>
        <li><b>I didn&apos;t get the email to confirm my account.</b> Check your junk folder for an email from noreply@aotd.world. If it isn&apos;t there, try making the account again, or get in touch below.</li>
        <li><b>I&apos;ve forgotten my password.</b> Use <Link href="/login?mode=reset">Forgotten your password?</Link> on the sign-in page.</li>
        <li><b>I&apos;m not getting the morning notification.</b> In the app, go to Account and turn on Daily notification, then tap Send a test. Check notifications are allowed for Album of the Day in your phone&apos;s Settings.</li>
        <li><b>Someone posted something nasty.</b> Tap Report under the comment, or Block to stop seeing that person.</li>
        <li><b>How do I delete my account?</b> Account, then Sign out or leave, then Delete my account. It&apos;s immediate.</li>
      </ul>

      <h2>Get in touch</h2>
      <p>Bugs, ideas, problems with your account or anything else. Messages go straight to the person who runs Album of the Day.</p>
      <SupportForm />

      <p className="msg" style={{ marginTop: 24 }}>
        <Link href="/terms">Terms of use</Link> · <Link href="/privacy">Privacy policy</Link>
      </p>
    </article>
  );
}
