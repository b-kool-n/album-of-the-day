import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { formatDay } from "@/lib/dates";
import { Disc } from "@/components/Logo";
import { signOut } from "../login/actions";
import { DeleteAccountForm, FeedbackForm, NameForm } from "./forms";
import { replayTour } from "./actions";
import { PushSettings } from "./PushSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account · Album of the Day" };

export default async function AccountPage() {
  const { supabase, userId, email, profile } = await getViewer();
  if (!userId || !profile) {
    return (
      <div className="empty">
        <Disc />
        <h2>Account</h2>
        <p><Link href="/login">Sign in</Link> or <Link href="/login?mode=signup">make an account</Link>.</p>
      </div>
    );
  }

  const [{ count: scored }, { count: suggested }, { data: devices }, { data: publicKey }] = await Promise.all([
    supabase.from("ratings").select("day", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("push_subscriptions").select("id").eq("user_id", userId),
    supabase.rpc("vapid_public_key"),
  ]);

  return (
    <>
      <h1 className="page-title">Account</h1>

      {profile.is_blocked && (
        <div className="banner"><b>Your account is limited.</b> You can still score albums, but you can&apos;t comment, add notes or suggest albums at the moment.</div>
      )}

      <section className="panel">
        <h2>Your account</h2>
        <dl className="facts-list">
          <div><dt>Email</dt><dd>{email ?? "–"}</dd></div>
          <div><dt>Joined</dt><dd>{formatDay(profile.created_at.slice(0, 10), true)}</dd></div>
          <div><dt>Albums scored</dt><dd><span className="num">{scored ?? 0}</span> · <Link href="/me">See your scores</Link></dd></div>
          <div><dt>Albums suggested</dt><dd><span className="num">{suggested ?? 0}</span> · <Link href="/suggest">Suggest one</Link></dd></div>
        </dl>
        <NameForm name={profile.display_name} />
      </section>

      <section className="panel">
        <h2>Daily notification</h2>
        <div className="sub">A nudge each morning when the new album is out. Set it up on each phone or computer you use.</div>
        <PushSettings publicKey={(publicKey as string | null) ?? null} deviceCount={devices?.length ?? 0} />
      </section>

      <section className="panel">
        <h2>Leave feedback</h2>
        <div className="sub">Goes straight to the curator. Good for bugs, ideas and anything else.</div>
        <FeedbackForm />
      </section>

      <section className="panel">
        <h2>Privacy and support</h2>
        <p className="msg">What we store, why, and how to get help.</p>
        <div className="inline">
          <Link className="btn ghost small" href="/privacy">Read the privacy policy</Link>
          <form action={replayTour}><button className="btn ghost small" type="submit">Replay the tour</button></form>
        </div>
      </section>

      <section className="panel">
        <h2>Sign out or leave</h2>
        <form action={signOut} className="inline" style={{ marginTop: 12 }}>
          <button className="btn ghost" type="submit">Sign out</button>
        </form>
        <DeleteAccountForm />
      </section>
    </>
  );
}
