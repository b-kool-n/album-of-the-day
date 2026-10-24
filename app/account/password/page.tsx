import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { PasswordForm } from "./PasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New password · Album of the Day" };

// Reached from the "Reset password" email (already signed in by then), or from Account.
export default async function NewPasswordPage() {
  const { userId } = await getViewer();
  if (!userId) {
    return (
      <div className="auth">
        <h1>Link expired</h1>
        <p className="msg">That link has expired or was already used. <Link href="/login?mode=reset">Ask for a new one</Link>.</p>
      </div>
    );
  }
  return (
    <div className="auth">
      <h1>New password</h1>
      <p className="msg">Choose a new password for your account. If you use the phone app, sign in there with it afterwards.</p>
      <PasswordForm />
    </div>
  );
}
