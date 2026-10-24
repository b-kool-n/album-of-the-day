import { useState } from "react";
import { Modal, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";
import { Button, T } from "./ui";

// Same words as the website's tour.
const STEPS = [
  { tab: "Today", body: "Score today's album here and see how your ratings compare with the rest of the world. You can comment too, but keep it clean." },
  { tab: "Your scores", body: "Look back on everything you've scored and find albums to relisten. Recommendations are coming in a future release." },
  { tab: "Archive", body: "Browse every past Album of the Day." },
  { tab: "Suggest", body: "Add your suggestions for future Albums of the Day." },
  { tab: "Account", body: "See your account overview, choose your notification settings, leave feedback and manage your account." },
] as const;

// Where the middle of each tab sits, as a share of the screen width. iOS 26 draws the tab bar
// as a floating pill and sizes each tab to its label (measured from a real iPhone); elsewhere
// the five tabs share the full width equally.
const IOS_PILL = Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) >= 26;
const TAB_CENTRES = IOS_PILL ? [0.157, 0.339, 0.518, 0.681, 0.842] : [0.1, 0.3, 0.5, 0.7, 0.9];

// First sign-in tour: a card above the tab bar that points at each tab in turn.
export function Tour() {
  const { session, refreshProfile } = useSession();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(true);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  async function finish() {
    setOpen(false);
    if (session) await supabase.from("profiles").update({ tour_seen: true }).eq("id", session.user.id);
    refreshProfile();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={finish} statusBarTranslucent>
      <View style={st.dim}>
        <View style={[st.wrap, { paddingBottom: insets.bottom + 54 }]}>
          <View style={st.card} accessibilityViewIsModal>
            {i === 0 && <T v="eyebrow">Welcome to Album of the Day</T>}
            <T style={st.title} accessibilityRole="header">{step.tab}</T>
            <T style={{ marginTop: 6 }}>{step.body}</T>
            <View style={st.foot}>
              <T v="small" style={{ fontFamily: F.mono }}>{i + 1} of {STEPS.length}</T>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                {i === 0 ? <Button kind="link" label="Skip tour" onPress={finish} /> : <Button kind="ghost" small label="Back" onPress={() => setI(i - 1)} />}
                <Button small label={last ? "Start listening" : "Next"} onPress={() => (last ? finish() : setI(i + 1))} />
              </View>
            </View>
          </View>
          {/* An arrow pointing down at the tab being explained. */}
          <View style={st.tabs} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text style={[st.arrow, { left: TAB_CENTRES[i] * width - 9 }]}>▼</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  dim: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  wrap: { paddingHorizontal: 16 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.orange, borderRadius: 16, padding: 18, maxWidth: 520, width: "100%", alignSelf: "center" },
  title: { fontFamily: F.display, fontSize: 28, lineHeight: 30, textTransform: "uppercase", marginTop: 4 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, gap: 10 },
  tabs: { height: 24, marginTop: 10, marginHorizontal: -16 },
  arrow: { position: "absolute", bottom: 0, width: 18, textAlign: "center", color: C.orange, fontSize: 18, lineHeight: 22 },
});
