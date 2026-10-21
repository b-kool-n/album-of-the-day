import { StyleSheet, View } from "react-native";
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

// The bigger record used beside the sleeve and on empty pages.
export function Disc({ size }: { size: number }) {
  return <Record size={size} grooves={7} />;
}

function ring(d: number) {
  return { position: "absolute" as const, width: d, height: d, borderRadius: d / 2, borderWidth: 1 };
}
