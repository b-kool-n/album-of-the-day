import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { REMINDER_TIMES, shortTime } from "@/lib/reminder-times";
import { C, F } from "@/lib/theme";
import { Sheet } from "./Sheet";
import { Button, Message, T } from "./ui";

// When the morning notification arrives. One time per person, used on all their devices.
export function ReminderTime() {
  const { profile, refreshProfile } = useSession();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (!profile) return null;
  const current = shortTime(profile.reminder_time);

  async function choose(time: string) {
    if (time === current) return setOpen(false);
    setSaving(time);
    setError(null);
    setDone(null);
    const { error: err } = await supabase.from("profiles").update({ reminder_time: time }).eq("id", profile!.id);
    if (err) {
      setSaving(null);
      return setError("Couldn't save the time. Try again.");
    }
    await refreshProfile();
    Haptics.selectionAsync().catch(() => {});
    setSaving(null);
    setOpen(false);
    setDone(`Saved. It comes at ${time} each day.`);
  }

  return (
    <View>
      <View style={st.row}>
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: F.semibold }}>Time</T>
          <T v="muted">UK time, on all your devices</T>
        </View>
        <Button kind="ghost" small label={`${current} · Change`} onPress={() => setOpen(true)} />
      </View>
      <Message error={error} done={done} />
      {open && (
        <Sheet onClose={() => setOpen(false)} label="Choose a time">
          <T v="eyebrow">Morning notification</T>
          <T style={st.title} accessibilityRole="header">Choose a time</T>
          <T v="muted" style={{ marginTop: 4 }}>UK time. The album is out from midnight, so any time works.</T>
          <View style={st.grid}>
            {REMINDER_TIMES.map((t) => {
              const on = t === current;
              return (
                <Pressable
                  key={t}
                  onPress={() => choose(t)}
                  disabled={!!saving}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, busy: saving === t }}
                  style={({ pressed }) => [st.time, on && st.timeOn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[st.timeText, on && { color: C.onOrange }]}>{saving === t ? "…" : t}</Text>
                </Pressable>
              );
            })}
          </View>
        </Sheet>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 14 },
  title: { fontFamily: F.display, fontSize: 30, lineHeight: 32, textTransform: "uppercase", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  time: { width: "22.5%", alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.line },
  timeOn: { backgroundColor: C.orange, borderColor: C.orange },
  timeText: { fontFamily: F.mono, fontSize: 15, color: C.ink },
});
