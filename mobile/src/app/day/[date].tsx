import { Redirect, useLocalSearchParams } from "expo-router";
import { isIsoDate, ukToday } from "@/lib/dates";
import { DayView } from "@/components/DayView";

export default function PastDay() {
  const { date } = useLocalSearchParams<{ date: string }>();
  if (!date || !isIsoDate(date)) return <Redirect href="/archive" />;
  if (date === ukToday()) return <Redirect href="/" />;
  return <DayView day={date} showBack />;
}
