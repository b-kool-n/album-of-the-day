import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { AuthForm } from "./AuthForm";
import { ResetForm } from "./ResetForm";
import { continueWith } from "./actions";
import { enabledProviders } from "@/lib/auth-providers";

export const metadata = { title: "Sign in · Album of the Day" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string; error?: string; deleted?: string; confirmed?: string }> }) {
  const { profile } = await getViewer();
  if (profile) redirect("/");
  const { mode, error, deleted, confirmed } = await searchParams;
  if (deleted) {
    return (
      <div className="auth">
        <h1>Account deleted</h1>
        <p className="msg">Your account and everything in it has been removed. Thanks for listening.</p>
        <p className="switch-mode"><Link href="/">Back to today&apos;s album</Link></p>
      </div>
    );
  }
  if (mode === "reset") {
    return (
      <div className="auth">
        <h1>Forgotten password</h1>
        <p className="msg">Enter the email you signed up with and we&apos;ll send you a link to choose a new password.</p>
        <ResetForm />
        <p className="switch-mode">Remembered it? <Link href="/login">Sign in</Link></p>
      </div>
    );
  }

  const signUp = mode === "signup";
  const providers = await enabledProviders();
  return (
    <div className="auth">
      <h1>{signUp ? "Join in" : "Sign in"}</h1>
      <p className="msg">{signUp ? "Make an account to score albums and keep your history." : "Welcome back."}</p>
      {confirmed && (
        // Email links from accounts made in the phone app land here.
        <p className="msg ok" role="status">Your email is confirmed. If you made your account in the app, go back to it and sign in there. Or sign in here.</p>
      )}
      {error === "link" && (
        <p className="msg err" role="alert">That link has expired or was already used. Sign in with your email and password.</p>
      )}
      {error === "provider" && (
        <p className="msg err" role="alert">That sign-in option isn&apos;t available right now. Use your email and password instead.</p>
      )}
      {(providers.apple || providers.google) && (
        <div className="providers">
          {providers.apple && (
            <form action={continueWith}>
              <input type="hidden" name="provider" value="apple" />
              <button className="btn provider" type="submit">Continue with Apple</button>
            </form>
          )}
          {providers.google && (
            <form action={continueWith}>
              <input type="hidden" name="provider" value="google" />
              <button className="btn provider" type="submit">Continue with Google</button>
            </form>
          )}
          <p className="msg small">By continuing you agree to the <Link href="/terms">terms of use</Link>.</p>
          <p className="or"><span>or use your email</span></p>
        </div>
      )}
      <AuthForm mode={signUp ? "signup" : "signin"} />
      {!signUp && <p className="switch-mode"><Link href="/login?mode=reset">Forgotten your password?</Link></p>}
      <p className="switch-mode">
        {signUp ? (
          <>Already have an account? <Link href="/login">Sign in</Link></>
        ) : (
          <>New here? <Link href="/login?mode=signup">Make an account</Link></>
        )}
      </p>
      <p className="switch-mode"><Link href="/support">Help</Link> · <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></p>
    </div>
  );
}
