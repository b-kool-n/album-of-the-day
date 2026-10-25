import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet } from "react-native";
import { C } from "@/lib/theme";

// Picks up exactly where the phone's own opening screen leaves off (same record, same size,
// same place), gives it a turn, then fades into the app. Once per launch.
export function OpeningSpin() {
  const [done, setDone] = useState(false);
  const [turn] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!live) return;
      const out = Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true });
      const sequence = reduce
        ? Animated.sequence([Animated.delay(150), out])
        : Animated.sequence([Animated.timing(turn, { toValue: 1, duration: 1100, easing: Easing.bezier(0.45, 0, 0.25, 1), useNativeDriver: true }), out]);
      sequence.start(() => live && setDone(true));
    });
    return () => {
      live = false;
    };
  }, [turn, fade]);

  if (done) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, st.screen, { opacity: fade }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={{ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
        {/* The same picture as the opening screen in app.json (expo-splash-screen, imageWidth 180). */}
        <Image source={require("../../assets/images/splash-icon.png")} style={{ width: 180, height: 180 }} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  screen: { backgroundColor: C.bg, alignItems: "center", justifyContent: "center", zIndex: 100 },
});
