import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { C } from "@/lib/theme";

// Black vinyl on hot orange: the app's logo, drawn with plain shapes.
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Record size={size * 0.78} />
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

// Spotify's mark, as on the website's "Listen on Spotify" button.
export function SpotifyMark({ size = 20, colour = C.onOrange, wave = C.orange }: { size?: number; colour?: string; wave?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={12} cy={12} r={11} fill={colour} />
      <Path d="M6.5 9.2c3.7-1.1 7.9-.8 11 1M7.2 12.3c3-.8 6.4-.6 9.2.9M7.9 15.2c2.4-.6 5-.4 7.2.8" stroke={wave} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function ring(d: number) {
  return { position: "absolute" as const, width: d, height: d, borderRadius: d / 2, borderWidth: 1 };
}
