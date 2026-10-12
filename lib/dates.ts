// The album changes at midnight UK time for everyone.
export function ukToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T12:00:00Z"));
}

export function formatDay(iso: string, long = false): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return date.toLocaleDateString(
    "en-GB",
    long
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
      : { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" },
  );
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}
