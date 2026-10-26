import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { F } from "@/lib/theme";
import { goToSignIn, goToSignUp } from "./Join";
import { Sheet } from "./Sheet";
import { Button, T } from "./ui";

const SEEN_KEY = "welcome_seen";

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Worst case it shows again next time.
  }
}

// The first time someone opens the app without an account.
export function WelcomeSheet() {
  const [open, setOpen] = useState(() => !seen());
  if (!open) return null;

  function close(then?: () => void) {
    markSeen();
    setOpen(false);
    then?.();
  }

  return (
    <Sheet onClose={() => close()} label="Welcome to Album of the Day">
      <T v="eyebrow">Welcome</T>
      <T style={st.title} accessibilityRole="header">One album a day</T>
      <T style={{ marginTop: 8 }}>
        Listen to today&apos;s album start to finish, then score it. Make an account to score it and see how everyone else rated it.
      </T>
      <View style={st.buttons}>
        <Button label="Make an account" onPress={() => close(goToSignUp)} />
        <Button kind="ghost" label="Look around first" onPress={() => close()} />
        <Button kind="link" label="I already have an account" onPress={() => close(goToSignIn)} style={{ alignSelf: "center" }} />
      </View>
    </Sheet>
  );
}

const st = StyleSheet.create({
  title: { fontFamily: F.display, fontSize: 30, lineHeight: 32, textTransform: "uppercase", marginTop: 4 },
  buttons: { gap: 10, marginTop: 18 },
});
