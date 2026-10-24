import * as Sharing from "expo-sharing";
import { Image } from "expo-image";
import { useRef, useState, type ComponentRef } from "react";
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useStreak } from "@/lib/streak";
import { formatDay } from "@/lib/dates";
import { MEASURES, oneDecimal, type Album, type DayAverages, type Rating } from "@/lib/types";
import { C, F } from "@/lib/theme";
import { Disc, Logo } from "./Logo";
import { Sleeve } from "./Sleeve";
import { Button, Message, T } from "./ui";

type Props = { album: Pick<Album, "artist" | "title" | "cover_url">; number: number; day: string; mine: Rating; avg: DayAverages | null };

// The card is drawn at 340 × 425 points and saved at 1080 × 1350 pixels (the 4:5 shape that
// suits group chats, Instagram posts and stories).
const W = 340;
const H = 425;

// "Share my scores" button, with a preview of the image before it goes anywhere.
export function ShareScores(props: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const card = useRef<ComponentRef<typeof View>>(null);
  if (Platform.OS === "web") return null;

  async function share() {
    setBusy(true);
    setError(null);
    try {
      const uri = await captureRef(card, { format: "png", quality: 1, width: 1080, height: 1350, result: "tmpfile" });
      await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: "Share your scores" });
    } catch {
      setError("Couldn't make the image. Try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <Button kind="ghost" small label="Share my scores" onPress={() => setOpen(true)} style={{ alignSelf: "flex-start", marginTop: 16 }} />
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: C.surface }} contentContainerStyle={st.sheet}>
          <T v="h2" accessibilityRole="header">Share your scores</T>
          <T v="muted" style={{ marginTop: 4, marginBottom: 18 }}>This is the image you&apos;ll share.</T>
          <View ref={card} collapsable={false} style={st.cardShadow}>
            <Card {...props} />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
            <Button label={busy ? "Getting it ready…" : "Share"} onPress={share} busy={busy} style={{ flex: 1 }} />
            <Button kind="ghost" label="Close" onPress={() => setOpen(false)} />
          </View>
          <Message error={error} />
        </ScrollView>
      </Modal>
    </>
  );
}

function Card({ album, number, day, mine, avg }: Props) {
  const { streak } = useStreak();
  const sleeve = 136;
  return (
    <View style={st.card} accessible accessibilityLabel={`Your scores for ${album.title} by ${album.artist}: ${oneDecimal(mine.overall)} overall.`}>
      <View style={st.top}>
        <Logo size={24} />
        <Text style={st.brand}>Album of the Day</Text>
        <Text style={st.no}>No. {number}</Text>
      </View>

      <View style={st.mid}>
        <View style={{ width: sleeve + 52, height: sleeve }}>
          <View style={{ position: "absolute", left: 0, top: 0 }}>
            {album.cover_url ? (
              <Image source={{ uri: album.cover_url }} style={{ width: sleeve, height: sleeve }} contentFit="cover" />
            ) : (
              <Sleeve album={album} size={sleeve} number={number} />
            )}
          </View>
          <View style={{ position: "absolute", left: 52, top: 4 }}>
            <Disc size={sleeve - 8} />
          </View>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={st.eyebrow}>My score</Text>
          <Text style={st.overall}>{oneDecimal(mine.overall)}</Text>
          {avg?.overall != null && <Text style={st.everyone} numberOfLines={1}>Everyone {oneDecimal(avg.overall)}</Text>}
        </View>
      </View>

      <Text style={st.title} numberOfLines={2}>{album.title}</Text>
      <Text style={st.artist} numberOfLines={1}>{album.artist}</Text>

      <View style={{ marginTop: 12, gap: 7 }}>
        {MEASURES.map((m) => {
          const skipped = m.key === "nostalgia" && mine.new_to_me;
          const v = skipped ? null : Number(mine[m.key]);
          return (
            <View key={m.key} style={st.row}>
              <Text style={st.rowLabel}>{skipped ? "New to me" : m.short}</Text>
              <View style={st.track}>{v != null && <View style={[st.fill, { width: `${v * 10}%` }]} />}</View>
              <Text style={st.rowVal}>{v == null ? "–" : oneDecimal(v)}</Text>
            </View>
          );
        })}
      </View>

      <View style={st.foot}>
        <Text style={st.footText}>{formatDay(day)}{streak.current >= 2 ? ` · ${streak.current}-day streak` : ""}</Text>
        <Text style={[st.footText, { color: C.orange }]}>aotd.world</Text>
      </View>
    </View>
  );
}

export function ShareCardPreview(props: Props) {
  return <Card {...props} />;
}

const st = StyleSheet.create({
  sheet: { padding: 20, paddingTop: 28, alignItems: "center" },
  cardShadow: { borderRadius: 18, overflow: "hidden" },
  card: { width: W, height: H, backgroundColor: C.bg, padding: 20, borderWidth: 2, borderColor: C.orange, borderRadius: 18 },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { flex: 1, fontFamily: F.display, fontSize: 17, color: C.ink, textTransform: "uppercase" },
  no: { fontFamily: F.monoBold, fontSize: 13, color: C.muted },
  mid: { flexDirection: "row", alignItems: "flex-end", marginTop: 16 },
  eyebrow: { fontFamily: F.mono, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 },
  overall: { fontFamily: F.display, fontSize: 52, lineHeight: 54, color: C.orange },
  everyone: { fontFamily: F.mono, fontSize: 12, color: C.muted },
  title: { fontFamily: F.display, fontSize: 28, lineHeight: 29, color: C.ink, textTransform: "uppercase", marginTop: 14 },
  artist: { fontFamily: F.semibold, fontSize: 15, color: C.ink, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { width: 84, fontFamily: F.semibold, fontSize: 12, color: C.muted },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.line, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.orange },
  rowVal: { width: 30, textAlign: "right", fontFamily: F.monoBold, fontSize: 13, color: C.ink },
  foot: { flexDirection: "row", justifyContent: "space-between", marginTop: "auto" },
  footText: { fontFamily: F.mono, fontSize: 11, color: C.muted },
});
