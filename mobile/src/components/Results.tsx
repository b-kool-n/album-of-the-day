import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { MEASURES, oneDecimal, type DayAverages, type Rating } from "@/lib/types";
import { C, F } from "@/lib/theme";
import { Panel, T } from "./ui";

export type DayNote = { user_id: string; note: string; overall: number; profiles: { display_name: string } | null };

export function Results({ mine, avg, notes, isToday, share }: { mine: Rating; avg: DayAverages | null; notes: DayNote[]; isToday: boolean; share?: ReactNode }) {
  const n = avg?.ratings ?? 1;
  return (
    <Panel
      title={isToday ? "Today's scores" : "Scores for this day"}
      sub={`${n} ${n === 1 ? "person" : "people"} scored this`}
    >
      <View style={st.pair}>
        <View>
          <T v="eyebrow">You</T>
          <T style={[st.bigNum, { color: C.orange }]}>{oneDecimal(mine.overall)}</T>
        </View>
        <View>
          <T v="eyebrow">Average</T>
          <T style={st.bigNum}>{oneDecimal(avg?.overall)}</T>
        </View>
      </View>

      <View style={{ marginTop: 16, gap: 14 }}>
        {MEASURES.map((m) => {
          const you = m.key === "nostalgia" && mine.new_to_me ? null : Number(mine[m.key]);
          const a = avg?.[m.key] == null ? null : Number(avg[m.key]);
          const knew = m.key === "nostalgia" && avg && avg.nostalgia_ratings !== avg.ratings ? ` (${avg.nostalgia_ratings} knew it)` : "";
          return (
            <View key={m.key} accessible accessibilityLabel={`${m.short}: you ${you == null ? "skipped" : oneDecimal(you)}, average ${oneDecimal(a)} out of 10`}>
              <View style={st.barHead}>
                <T style={{ fontFamily: F.semibold, fontSize: 14, flex: 1 }}>
                  {m.short}
                  {knew ? <T v="small">{knew}</T> : null}
                </T>
                <T style={st.figs}>
                  you <T style={st.figsB}>{you == null ? "–" : oneDecimal(you)}</T> · avg <T style={st.figsB}>{oneDecimal(a)}</T>
                </T>
              </View>
              <View style={st.track}>
                {a != null && <View style={[st.avg, { width: `${a * 10}%` }]} />}
                {you != null && <View style={[st.you, { left: `${you * 10}%` }]} />}
              </View>
            </View>
          );
        })}
      </View>

      <View style={st.legend}>
        <View style={st.legendItem}><View style={[st.key, { backgroundColor: C.muted, opacity: 0.55 }]} /><T v="small">Average</T></View>
        <View style={st.legendItem}><View style={[st.key, { backgroundColor: C.orange }]} /><T v="small">You</T></View>
      </View>

      {share}

      {notes.length > 0 && (
        <View style={{ marginTop: 18, gap: 10 }}>
          {notes.map((x) => (
            <View key={x.user_id} style={st.note}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <T v="small" style={{ flex: 1 }}>{x.profiles?.display_name || "Someone"}</T>
                <T style={{ fontFamily: F.monoBold }}>{oneDecimal(x.overall)}</T>
              </View>
              <T style={{ marginTop: 4 }}>{x.note}</T>
            </View>
          ))}
        </View>
      )}
    </Panel>
  );
}

const st = StyleSheet.create({
  pair: { flexDirection: "row", gap: 28, marginTop: 14 },
  bigNum: { fontFamily: F.monoBold, fontSize: 30, lineHeight: 34 },
  barHead: { flexDirection: "row", alignItems: "baseline", gap: 12, marginBottom: 6 },
  figs: { fontFamily: F.mono, fontSize: 13, color: C.muted },
  figsB: { fontFamily: F.monoBold, fontSize: 13, color: C.ink },
  track: { height: 10, borderRadius: 6, backgroundColor: C.line },
  avg: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 6, backgroundColor: C.muted, opacity: 0.55 },
  you: { position: "absolute", top: -4, width: 4, height: 18, marginLeft: -2, borderRadius: 2, backgroundColor: C.orange },
  legend: { flexDirection: "row", gap: 16, marginTop: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  key: { width: 12, height: 8, borderRadius: 3 },
  note: { padding: 12, borderRadius: 10, backgroundColor: C.bg },
});
