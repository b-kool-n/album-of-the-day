import { DayView } from "@/components/DayView";
import { ukToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  return <DayView day={ukToday()} />;
}
