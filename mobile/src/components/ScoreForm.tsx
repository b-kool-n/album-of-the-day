import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { MEASURES, oneDecimal, type MeasureKey, type Rating } from "@/lib/types";
import { C, F } from "@/lib/theme";
import { Button, Field, Message, Panel, T, Toggle } from "./ui";

type Props = { day: string; userId: string; isToday: boolean; mine: Rating | null; onSaved: () => void };

export function ScoreForm({ day, userId, isToday, mine, onSaved }: Props) {
  const [values, setValues] = useState<Record<MeasureKey, number>>({
    back_to_back: mine ? Number(mine.back_to_back) : 5,
    vibes: mine ? Number(mine.vibes) : 5,
    nostalgia: mine?.nostalgia != null ? Number(mine.nostalgia) : 5,
    relisten: mine ? Number(mine.relisten) : 5,
  });
  const [newToMe, setNewToMe] = useState(mine?.new_to_me ?? false);
  const [note, setNote] = useState(mine?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const counted = MEASURES.filter((m) => !(m.key === "nostalgia" && newToMe)).map((m) => values[m.key]);
  const overall = Math.round((counted.reduce((a, b) => a + b, 0) / counted.length) * 10) / 10;

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const row = {
      back_to_back: values.back_to_back,
      vibes: values.vibes,
      nostalgia: newToMe ? null : values.nostalgia,
      relisten: values.relisten,
      new_to_me: newToMe,
      note: note.trim().slice(0, 500) || null,
    };
    // The database checks the scores, the day and the lock time.
    const { error: e } = mine
      ? await supabase.from("ratings").update(row).eq("user_id", userId).eq("day", day).select("day").single()
      : await supabase.from("ratings").insert({ ...row, user_id: userId, day }).select("day").single();
    setBusy(false);
    if (e) {
      if (e.message.includes("banned_words")) return setError("Your note includes a word that isn't allowed here. Please reword it.");
      if (e.message.includes("blocked")) return setError("Your account can't add notes at the moment. Clear the note and save again.");
      return setError(mine ? "Scores lock at midnight UK time on the day you give them, so these can't be changed now." : "Couldn't save your scores. Try again.");
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    onSaved();
  }

  return (
    <Panel
      title={mine ? "Change your scores" : "Score it"}
      sub={mine ? "You can change these until midnight UK time." : isToday ? "Out of 10, in half points." : "Late score for a past day. Out of 10, in half points."}
    >
      <Toggle label="New to me" detail="Turn on if you hadn't heard it before. Nostalgia is left out." value={newToMe} onChange={setNewToMe} />

      {MEASURES.map((m, i) => {
        const off = m.key === "nostalgia" && newToMe;
        return (
          <View key={m.key} style={[st.row, i === MEASURES.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={st.rowHead}>
              <T style={[{ fontFamily: F.semibold, flex: 1 }, off && { color: C.muted }]}>{m.name}</T>
              <T style={[st.val, off && { color: C.muted }]}>{off ? "–" : oneDecimal(values[m.key])}</T>
            </View>
            <T v="small">{m.question}</T>
            <Slider
              style={st.slider}
              minimumValue={0}
              maximumValue={10}
              step={0.5}
              value={values[m.key]}
              disabled={off}
              minimumTrackTintColor={off ? C.line : C.orange}
              maximumTrackTintColor={C.line}
              thumbTintColor={off ? C.muted : C.orange}
              accessibilityLabel={m.name}
              accessibilityValue={{ min: 0, max: 10, now: values[m.key], text: off ? "Left out" : `${oneDecimal(values[m.key])} out of 10` }}
              onValueChange={(v) => {
                const n = Math.round(v * 2) / 2;
                if (n !== values[m.key]) {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setValues((prev) => ({ ...prev, [m.key]: n }));
                }
              }}
            />
          </View>
        );
      })}

      <Field
        label="Note (optional)"
        placeholder="Carried by one track? Better than you remembered?"
        multiline
        value={note}
        onChangeText={setNote}
        max={500}
        count={note.length}
      />

      <View style={st.submit}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <T style={st.big}>{oneDecimal(overall)}</T>
          <T v="muted">overall</T>
        </View>
        <Button label={busy ? "Saving…" : mine ? "Update scores" : "Save scores"} onPress={save} busy={busy} />
      </View>
      <Message error={error} done={saved && !error ? "Saved." : null} />
    </Panel>
  );
}

const st = StyleSheet.create({
  row: { paddingTop: 14, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  rowHead: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  val: { fontFamily: F.monoBold, fontSize: 22, lineHeight: 28, minWidth: 48, textAlign: "right" },
  slider: { width: "100%", height: 40, marginTop: 4 },
  submit: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18, flexWrap: "wrap" },
  big: { fontFamily: F.monoBold, fontSize: 34, lineHeight: 38 },
});
