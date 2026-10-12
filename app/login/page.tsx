import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { AuthForm } from "./AuthForm";

export const metadata = { title: "Sign in · Album of the Day" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { profile } = await getViewer();
  if (profile) redirect("/");
  const { mode } = await searchParams;
  const signUp = mode === "signup";
  return (
    <div className="auth">
      <h1>{signUp ? "Join in" : "Sign in"}</h1>
      <p className="msg">{signUp ? "Make an account to score albums and keep your history." : "Welcome back."}</p>
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
