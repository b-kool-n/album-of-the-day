import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";

// Where Android lands after "Continue with Google" hands back to the app. The sign-in itself is
// finished by the login screen, so this just moves on.
export default function AuthReturn() {
  const { session } = useSession();
  return <Redirect href={session ? "/" : "/login"} />;
}
