import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Album } from "@/lib/types";
import { C, F } from "@/lib/theme";
import { Sleeve } from "./Sleeve";

export type CoverItem = {
  key: string;
  album: Pick<Album, "artist" | "title" | "cover_url">;
  /** Small label in the corner of the cover, e.g. a score or "No. 12". */
  badge?: string;
  hot?: boolean;
  /** Line under the cover. */
  caption?: string;
  onPress: () => void;
  label: string;
};

// A shelf of album covers, three to a row. Wraps onto new rows rather than scrolling sideways.
export function CoverGrid({ items, columns = 3 }: { items: CoverItem[]; columns?: number }) {
  const [width, setWidth] = useState(0);
  const gap = 10;
  const size = width ? Math.floor((width - gap * (columns - 1)) / columns) : 0;

  return (
    <View style={st.grid} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {size > 0 &&
        items.map((it) => (
          <Pressable
            key={it.key}
            onPress={it.onPress}
            accessibilityRole="button"
            accessibilityLabel={it.label}
            style={({ pressed }) => [{ width: size }, pressed && { opacity: 0.7 }]}
          >
            <View>
              <Sleeve album={it.album} size={size} />
              {it.badge ? (
                <View style={[st.badge, it.hot && { backgroundColor: C.orange }]}>
                  <Text style={[st.badgeText, it.hot && { color: C.onOrange }]}>{it.badge}</Text>
                </View>
              ) : null}
            </View>
            {it.caption ? <Text style={st.caption} numberOfLines={2}>{it.caption}</Text> : null}
          </Pressable>
        ))}
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { position: "absolute", right: 6, bottom: 6, backgroundColor: "rgba(0,0,0,0.78)", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontFamily: F.monoBold, fontSize: 12, color: C.ink },
  caption: { fontFamily: F.semibold, fontSize: 12, lineHeight: 15, color: C.ink, marginTop: 6 },
});
