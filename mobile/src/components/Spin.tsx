import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";

// Turns its contents like a record on a turntable. 1.8 seconds a turn is 33⅓ rpm.
// Stays still when the phone is set to reduce motion.
export function Spin({ on, children, secondsPerTurn = 1.8 }: { on: boolean; children: ReactNode; secondsPerTurn?: number }) {
  const [turn] = useState(() => new Animated.Value(0));
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!on || reduce) {
      turn.stopAnimation();
      return;
    }
    turn.setValue(0);
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: secondsPerTurn * 1000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [on, reduce, turn, secondsPerTurn]);

  return (
    <Animated.View style={{ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
      {children}
    </Animated.View>
  );
}
