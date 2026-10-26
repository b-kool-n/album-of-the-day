import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { WEB_URL, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { F } from "@/lib/theme";
import { Sheet } from "./Sheet";
import { Button, Message, T } from "./ui";

// Shown once to anyone who hasn't agreed to the terms yet.
export function TermsPrompt() {
  const { refreshProfile } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agree() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc("accept_terms");
    if (err) {
      setBusy(false);
      return setError("Couldn't save that. Try again.");
    }
    await refreshProfile();
  }

  return (
    <Sheet label="Terms of use">
      <T v="eyebrow">Before you carry on</T>
      <T style={st.title} accessibilityRole="header">Terms of use</T>
      <T style={{ marginTop: 8 }}>
        Comments, notes and names are seen by other people. Be decent: no abuse, hate, sexual content or spam. You can
        report or block anyone who isn&apos;t.
      </T>
      <View style={st.foot}>
        <Button kind="link" label="Read the terms" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/terms`)} />
        <Button label={busy ? "One moment…" : "I agree"} onPress={agree} busy={busy} />
      </View>
      <Message error={error} />
    </Sheet>
  );
}

const st = StyleSheet.create({
  title: { fontFamily: F.display, fontSize: 30, lineHeight: 32, textTransform: "uppercase", marginTop: 4 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, gap: 10 },
});
