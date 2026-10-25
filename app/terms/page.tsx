import Link from "next/link";

export const metadata = { title: "Terms of use · Album of the Day" };

// Plain-English terms. Linked from sign-up, the app and the App Store listing.
export default function TermsPage() {
  return (
    <article className="prose">
      <h1 className="page-title">Terms of use</h1>
      <p className="msg">Last updated 25 October 2026</p>

      <p>
        Album of the Day is a small, independent app run by Benjamin Koolen in the UK. By making an account or using the app,
        you agree to these terms. They&apos;re short, so please read them.
      </p>

      <h2>Be decent</h2>
      <p>Comments, notes, names and suggestions are seen by other people. There is no tolerance for:</p>
      <ul>
        <li>abuse, bullying, harassment or threats, aimed at anyone;</li>
        <li>hateful content about anyone&apos;s race, ethnicity, religion, gender, sexuality, disability or any other part of who they are;</li>
        <li>sexual or violent content, or anything illegal;</li>
        <li>spam, adverts, or pretending to be someone else;</li>
        <li>sharing other people&apos;s private details.</li>
      </ul>
      <p>Talking about music is the point. Disagreeing about it is encouraged. Be kind while you do it.</p>

      <h2>What happens if someone breaks the rules</h2>
      <ul>
        <li>Anyone can <b>report</b> a comment. Comments with reports are hidden until the curator looks at them, usually within 24 hours.</li>
        <li>Anyone can <b>block</b> another person, so they no longer see that person&apos;s comments or notes.</li>
        <li>The curator can remove anything that breaks these terms, and can stop an account from commenting, adding notes or suggesting albums, or remove it altogether.</li>
      </ul>

      <h2>Your account</h2>
      <ul>
        <li>Keep your sign-in details to yourself. You&apos;re responsible for what&apos;s posted from your account.</li>
        <li>You can delete your account at any time from your <Link href="/account">Account</Link> page. Everything you&apos;ve added goes with it.</li>
      </ul>

      <h2>What you add</h2>
      <p>
        Your scores, notes and comments stay yours. By posting them you let Album of the Day show them to other people in the app
        and on the website. Suggestions that are picked become part of the album schedule.
      </p>

      <h2>Music and Spotify</h2>
      <p>
        Album details and covers come from Spotify, and belong to their owners. Album of the Day isn&apos;t made by or connected
        with Spotify. Listening happens in Spotify, under Spotify&apos;s own terms.
      </p>

      <h2>The small print</h2>
      <ul>
        <li>The app is free and provided as it is. It may change, have the odd bad day, or stop altogether.</li>
        <li>Nothing here takes away your rights under UK consumer law.</li>
        <li>If these terms change, the date at the top changes too, and anything important is flagged in the app.</li>
      </ul>

      <h2>Questions</h2>
      <p>
        See <Link href="/support">Help and support</Link>. How your information is handled is in the <Link href="/privacy">privacy policy</Link>.
      </p>
    </article>
  );
}
