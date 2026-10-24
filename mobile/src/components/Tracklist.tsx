import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { isTopSong, trackLength, trackLink, type Album } from "@/lib/types";
import { C, F } from "@/lib/theme";
import { Chip, Panel, T } from "./ui";

// The album's songs, closed until asked for. Tapping a song opens it in Spotify.
export function Tracklist({ album }: { album: Pick<Album, "artist" | "top_song" | "tracks"> }) {
  const [open, setOpen] = useState(false);
  const tracks = album.tracks ?? [];
  if (!tracks.length) return null;
  const minutes = Math.round(tracks.reduce((a, t) => a + t.duration_ms, 0) / 60000);

  return (
    <Panel>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={st.head}
        hitSlop={6}
      >
        <View style={{ flex: 1 }}>
          <T v="h2">Tracklist</T>
          <T v="muted" style={{ marginTop: 2 }}>{tracks.length} songs · {minutes} min</T>
        </View>
        <Text style={st.toggle}>{open ? "Hide" : "Show"}</Text>
      </Pressable>
      {open && (
        <View style={{ marginTop: 10 }}>
          {tracks.map((t) => {
            const top = isTopSong(album, t);
            return (
              <Pressable
                key={`${t.number}-${t.name}`}
                onPress={() => Linking.openURL(trackLink(album, t))}
                accessibilityRole="link"
                accessibilityLabel={`${t.number}. ${t.name}, ${trackLength(t.duration_ms)}${top ? ", most played" : ""}. Opens in Spotify.`}
                style={({ pressed }) => [st.row, pressed && { opacity: 0.6 }]}
              >
                <Text style={st.no}>{t.number}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[st.name, top && { color: C.orange }]} numberOfLines={2}>{t.name}</Text>
                  {top && <Chip label="Most played" hot style={{ alignSelf: "flex-start" }} />}
                </View>
                <Text style={st.len}>{trackLength(t.duration_ms)}</Text>
              </Pressable>
            );
          })}
          <T v="small" style={{ marginTop: 10 }}>Tap a song to play it in Spotify.</T>
        </View>
      )}
    </Panel>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  toggle: { fontFamily: F.semibold, fontSize: 14, color: C.orange },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, minHeight: 44 },
  no: { width: 22, fontFamily: F.mono, fontSize: 13, color: C.muted, textAlign: "right" },
  name: { fontFamily: F.semibold, fontSize: 15, color: C.ink },
  len: { fontFamily: F.mono, fontSize: 13, color: C.muted },
});
