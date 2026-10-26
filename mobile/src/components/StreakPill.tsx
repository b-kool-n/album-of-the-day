import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useStreak } from "@/lib/streak";
import { useSession } from "@/lib/session";
import { goToSignIn } from "./Join";
import { addDays, ukToday } from "@/lib/dates";
import { C, F } from "@/lib/theme";
import { Record } from "./Logo";
import { Button, T } from "./ui";

// Small pill in the top bar: a record and the number of days in a row. Tap for the details.
export function StreakPill() {
  const { session } = useSession();
  if (!session) {
    // Signed out: the top bar offers sign-in instead.
    return (
      <Pressable onPress={goToSignIn} hitSlop={8} accessibilityRole="button" style={({ pressed }) => [st.pill, pressed && { opacity: 0.7 }]}>
        <Text style={st.signIn} maxFontSizeMultiplier={1.3}>Sign in</Text>
      </Pressable>
    );
  }
  return <Streak />;
}

function Streak() {
  const { streak } = useStreak();
  const [open, setOpen] = useState(false);
  const live = streak.current > 0;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${streak.current} day streak`}
        accessibilityHint="Shows your streak"
        style={({ pressed }) => [st.pill, live && st.pillLive, pressed && { opacity: 0.7 }]}
      >
        <Record size={16} grooves={1} />
        <Text style={[st.pillNum, live && { color: C.orange }]} maxFontSizeMultiplier={1.3}>{streak.current}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.dim} onPress={() => setOpen(false)} accessibilityLabel="Close">
          <Pressable style={st.card} onPress={() => {}} accessibilityViewIsModal>
            <StreakDetails />
            <Button kind="ghost" small label="Close" onPress={() => setOpen(false)} style={{ alignSelf: "flex-end", marginTop: 18 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function StreakDetails() {
  const { streak } = useStreak();
  const today = ukToday();
  // Last four weeks, oldest first, in rows of seven.
  const days = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));

  const line = streak.scoredToday
    ? "Today's done. Come back tomorrow to keep it going."
    : streak.current > 0
      ? "Score today's album before midnight to keep it going."
      : "Score today's album to start a streak.";

  return (
    <View>
      <T v="eyebrow">Your streak</T>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 6 }}>
        <Text style={st.big}>{streak.current}</Text>
        <T style={{ fontFamily: F.semibold }}>{streak.current === 1 ? "day in a row" : "days in a row"}</T>
      </View>
      <T v="muted" style={{ marginTop: 2 }}>Best: <T style={{ fontFamily: F.monoBold, fontSize: 14 }}>{streak.best}</T></T>
      <T style={{ marginTop: 12 }}>{line}</T>

      <View style={st.grid} accessible accessibilityLabel={`Scored on the day ${days.filter((d) => streak.onDay.has(d)).length} of the last 28 days`}>
        {days.map((d) => {
          const scored = streak.onDay.has(d);
          const hadAlbum = streak.albumDays.has(d);
          return (
            <View
              key={d}
              style={[
                st.dot,
                scored ? { backgroundColor: C.orange, borderColor: C.orange } : hadAlbum ? null : { borderColor: "transparent", backgroundColor: C.line, opacity: 0.4 },
                d === today && { borderColor: C.ink, borderWidth: 2 },
              ]}
            />
          );
        })}
      </View>
      <View style={st.key}>
        <View style={st.keyItem}><View style={[st.keyDot, { backgroundColor: C.orange, borderColor: C.orange }]} /><T v="small">Scored on the day</T></View>
        <View style={st.keyItem}><View style={st.keyDot} /><T v="small">Missed</T></View>
      </View>
      <T v="small" style={{ marginTop: 10 }}>Late scores from the Archive don&apos;t count towards your streak.</T>
    </View>
  );
}

const st = StyleSheet.create({
  signIn: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: C.line, marginLeft: "auto" },
  pillLive: { borderColor: C.orange, backgroundColor: C.soft },
  pillNum: { fontFamily: F.monoBold, fontSize: 14, color: C.muted },
  dim: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  card: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 20, maxWidth: 420, width: "100%", alignSelf: "center" },
  big: { fontFamily: F.display, fontSize: 56, lineHeight: 58, color: C.orange },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16, width: 7 * 26 + 6 * 8 },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: C.muted },
  key: { flexDirection: "row", gap: 16, marginTop: 12 },
  keyItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  keyDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: C.muted },
});
