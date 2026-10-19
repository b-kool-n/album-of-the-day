import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { AuthForm } from "./AuthForm";

export const metadata = { title: "Sign in · Album of the Day" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string; error?: string; deleted?: string }> }) {
  const { profile } = await getViewer();
  if (profile) redirect("/");
  const { mode, error, deleted } = await searchParams;
  if (deleted) {
    return (
      <div className="auth">
        <h1>Account deleted</h1>
        <p className="msg">Your account and everything in it has been removed. Thanks for listening.</p>
        <p className="switch-mode"><Link href="/">Back to today&apos;s album</Link></p>
      </div>
    );
  }
  const signUp = mode === "signup";
  return (
    <div className="auth">
      <h1>{signUp ? "Join in" : "Sign in"}</h1>
      <p className="msg">{signUp ? "Make an account to score albums and keep your history." : "Welcome back."}</p>
      {error === "link" && (
        <p className="msg err" role="alert">That link has expired or was already used. Sign in with your email and password.</p>
      )}
      <AuthForm mode={signUp ? "signup" : "signin"} />
      <p className="switch-mode">
        {signUp ? (
          <>Already have an account? <Link href="/login">Sign in</Link></>
        ) : (
          <>New here? <Link href="/login?mode=signup">Make an account</Link></>
        )}
      </p>
    </div>
  );
}
