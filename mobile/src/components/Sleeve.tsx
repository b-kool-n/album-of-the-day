import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Text, View, type LayoutChangeEvent } from "react-native";
import type { Album } from "@/lib/types";
import { C, F } from "@/lib/theme";
import { Disc } from "./Logo";

const SLEEVE_COLOURS = ["#2B3A55", "#5B2333", "#1F4D3F", "#3D3A35", "#6B4E16", "#283845", "#4A2C4F", "#1E3B32", "#3B2A20", "#204059"];

function hash(str: string) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

type SleeveAlbum = Pick<Album, "artist" | "title" | "cover_url">;

// Album cover, or a plain printed sleeve when there's no cover yet.
export function Sleeve({ album, size, number }: { album: SleeveAlbum; size: number; number?: number }) {
  const label = `Cover of ${album.title} by ${album.artist}`;
  if (album.cover_url) {
    return <Image source={{ uri: album.cover_url }} style={{ width: size, height: size, backgroundColor: C.surface }} contentFit="cover" transition={150} accessibilityLabel={label} accessible />;
  }
  const small = size < 100;
  const colour = SLEEVE_COLOURS[hash(album.artist + album.title) % SLEEVE_COLOURS.length];
  return (
    <View style={{ width: size, height: size, backgroundColor: colour, padding: size * 0.08, justifyContent: small ? "flex-end" : "space-between", overflow: "hidden" }} accessible accessibilityLabel={label}>
      {!small && <Text style={{ fontFamily: F.mono, fontSize: Math.max(8, size * 0.03), color: "rgba(255,255,255,0.6)", letterSpacing: 0.6 }}>AOTD {number ? String(number).padStart(3, "0") : ""}</Text>}
      <View>
        <Text style={{ fontFamily: F.display, fontSize: Math.max(9, size * 0.08), lineHeight: Math.max(9, size * 0.08) * 0.95, color: "#fff", textTransform: "uppercase" }} numberOfLines={small ? 3 : 4}>
          {album.artist}
        </Text>
        {!small && <Text style={{ fontFamily: F.regular, fontSize: size * 0.046, color: "rgba(255,255,255,0.85)", marginTop: 4 }} numberOfLines={3}>{album.title}</Text>}
      </View>
    </View>
  );
}

// The sleeve with the record sliding out of it: the one big moment on the day page.
export function Deck({ album, number }: { album: SleeveAlbum; number?: number }) {
  const [width, setWidth] = useState(0);
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!width) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) slide.setValue(1);
      else Animated.timing(slide, { toValue: 1, duration: 1100, delay: 150, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [width, slide]);

  const w = Math.min(width, 440);
  const sleeve = w * 0.76;
  const disc = w * 0.72;
  return (
    <View style={{ width: "100%", marginTop: 20, marginBottom: 16 }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <View style={{ width: w, height: w / 1.32 }}>
          <View style={{ position: "absolute", left: 0, top: 0, shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 17, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
            <Sleeve album={album} size={sleeve} number={number} />
          </View>
          {/* The record sits on top of the sleeve and rolls out to the right, turning as it goes. */}
          <Animated.View
            style={{
              position: "absolute",
              right: 0,
              top: w * 0.03,
              elevation: 14,
              transform: [
                { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-disc * 0.34, 0] }) },
                { rotate: slide.interpolate({ inputRange: [0, 1], outputRange: ["-120deg", "0deg"] }) },
              ],
            }}
          >
            <Disc size={disc} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}
