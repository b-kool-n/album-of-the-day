import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { WEB_URL, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";
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
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={st.dim}>
        <View style={st.card} accessibilityViewIsModal>
          <T v="eyebrow">Before you carry on</T>
          <T style={st.title} accessibilityRole="header">Terms of use</T>
          <T style={{ marginTop: 8 }}>
            Comments, notes and names are seen by other people. Be decent: no abuse, hate, sexual content or spam. You can
            report or block anyone who isn&apos;t.
          </T>
          <View style={st.foot}>
            <Button kind="link" label="Read the terms" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/terms`)} />
            <Button small label={busy ? "One moment…" : "I agree"} onPress={agree} busy={busy} />
          </View>
          <Message error={error} />
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  dim: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", padding: 16 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.orange, borderRadius: 16, padding: 18, maxWidth: 520, width: "100%", alignSelf: "center" },
  title: { fontFamily: F.display, fontSize: 28, lineHeight: 30, textTransform: "uppercase", marginTop: 4 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, gap: 10 },
});
