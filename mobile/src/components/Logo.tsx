import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { C } from "@/lib/theme";
import { Spin } from "./Spin";

// Black vinyl on hot orange: the app's logo, drawn with plain shapes.
export function Logo({ size = 36, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Spin on={spinning}>
        <Record size={size * 0.78} />
      </Spin>
    </View>
  );
}

// A record: black disc, faint grooves, orange label, centre hole.
export function Record({ size, grooves = 3 }: { size: number; grooves?: number }) {
  const rings = Array.from({ length: grooves }, (_, i) => 0.86 - i * 0.14);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.vinyl, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.16)" }}>
      {rings.map((r) => (
        <View key={r} style={[ring(size * r), { borderColor: "#2B2724" }]} />
      ))}
      <View style={{ width: size * 0.34, height: size * 0.34, borderRadius: size, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: Math.max(2, size * 0.05), height: Math.max(2, size * 0.05), borderRadius: size, backgroundColor: C.vinyl }} />
      </View>
    </View>
  );
}

// The bigger record used beside the sleeve and on empty pages: fine grooves, two soft
// highlights (so you can see it turn as it rolls), orange label and centre hole. Same look as the website.
export function Disc({ size }: { size: number }) {
  const grooves: number[] = [];
  for (let r = 19.5; r < 48.5; r += 1.6) grooves.push(r);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={50} cy={50} r={50} fill="#070606" />
      {grooves.map((r) => (
        <Circle key={r} cx={50} cy={50} r={r} fill="none" stroke="#141210" strokeWidth={0.7} />
      ))}
      <Path d={sector(19, 49, 20, 70)} fill="#ffffff" fillOpacity={0.09} />
      <Path d={sector(19, 49, 200, 245)} fill="#ffffff" fillOpacity={0.06} />
      <Circle cx={50} cy={50} r={49.6} fill="none" stroke="#ffffff" strokeOpacity={0.14} strokeWidth={0.6} />
      <Circle cx={50} cy={50} r={18.2} fill={C.vinyl} />
      <Circle cx={50} cy={50} r={17} fill={C.orange} />
      <Circle cx={50} cy={50} r={2.4} fill={C.vinyl} />
    </Svg>
  );
}

// A ring-shaped slice between two radii and two angles (degrees, clockwise from the top).
function sector(inner: number, outer: number, from: number, to: number) {
  const pt = (r: number, a: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return `${(50 + r * Math.cos(t)).toFixed(2)} ${(50 + r * Math.sin(t)).toFixed(2)}`;
  };
  const large = to - from > 180 ? 1 : 0;
  return `M ${pt(outer, from)} A ${outer} ${outer} 0 ${large} 1 ${pt(outer, to)} L ${pt(inner, to)} A ${inner} ${inner} 0 ${large} 0 ${pt(inner, from)} Z`;
}

// Spotify's official icon (from Simple Icons), in one colour as Spotify's brand rules allow
// when their green won't sit on the background: black on our orange button.
const SPOTIFY_ICON = "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z";

export function SpotifyMark({ size = 20, colour = "#000000" }: { size?: number; colour?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={SPOTIFY_ICON} fill={colour} />
    </Svg>
  );
}

function ring(d: number) {
  return { position: "absolute" as const, width: d, height: d, borderRadius: d / 2, borderWidth: 1 };
}
