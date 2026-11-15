import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { sendDueReminders } from "@/lib/reminders";
import { addSongLinks } from "@/lib/song-links";
import { ukToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Called by Vercel at 07:00 and 08:00 UTC (see vercel.json). A backup for the 15-minute job in
// /api/cron/reminders: it sends to anyone whose chosen time has passed and who hasn't had today's
// notification yet, so nobody gets two.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  if (!hasAdminKey()) return NextResponse.json({ skipped: "SUPABASE_SECRET_KEY is not set" });
  const admin = createAdminClient();
  await addSongLinks(admin, ukToday());
  try {
    return NextResponse.json(await sendDueReminders(admin));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
