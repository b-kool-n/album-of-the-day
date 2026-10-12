import { notFound, redirect } from "next/navigation";
import { DayView } from "@/components/DayView";
import { isIsoDate, ukToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isIsoDate(date) || date > ukToday()) notFound();
  if (date === ukToday()) redirect("/");
  return <DayView day={date} />;
}
