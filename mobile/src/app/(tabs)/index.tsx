import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { ukToday } from "@/lib/dates";
import { DayView } from "@/components/DayView";

export default function Today() {
  // The album changes at midnight UK time, so check the date whenever the app comes back.
  const [day, setDay] = useState(ukToday());
  useFocusEffect(useCallback(() => setDay(ukToday()), []));
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && setDay(ukToday()));
    return () => sub.remove();
  }, []);
  return <DayView key={day} day={day} />;
}
