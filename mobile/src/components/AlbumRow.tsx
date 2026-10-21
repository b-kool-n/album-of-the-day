import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ukToday } from "@/lib/dates";
import type { Album } from "@/lib/types";
import { C } from "@/lib/theme";
import { Sleeve } from "./Sleeve";

// One row in a list of albums: small cover, words in the middle, figures on the right.
export function AlbumRow({ album, day, children, right, label }: { album: Pick<Album, "artist" | "title" | "cover_url">; day?: string; children: ReactNode; right?: ReactNode; label?: string }) {
  const inner = (
    <>
      <Sleeve album={album} size={56} />
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      {right && <View style={{ alignItems: "flex-end", gap: 4 }}>{right}</View>}
    </>
  );
  if (!day) return <View style={st.row}>{inner}</View>;
  return (
    <Pressable
      style={({ pressed }) => [st.row, pressed && { opacity: 0.7 }]}
      onPress={() => (day === ukToday() ? router.navigate("/") : router.push({ pathname: "/day/[date]", params: { date: day } }))}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {inner}
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
});
