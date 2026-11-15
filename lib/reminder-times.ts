// Times people can choose for their morning notification: 05:00 to 22:00, every 15 minutes, UK time.
export const REMINDER_TIMES: string[] = Array.from({ length: (22 - 5) * 4 + 1 }, (_, i) => {
  const mins = 5 * 60 + i * 15;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});
export const DEFAULT_REMINDER_TIME = "08:00";

// "07:30:00" from the database becomes "07:30".
export function shortTime(t: string | null | undefined): string {
  return (t ?? DEFAULT_REMINDER_TIME).slice(0, 5);
}
