import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { sendDueReminders } from "@/lib/reminders";
import { addSongLinks } from "@/lib/song-links";
import { ukToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Called every 15 minutes by the database (a pg_cron job), so each person's notification goes
// out at the time they chose. The job proves who it is with a secret kept in the database's vault.
async function run(request: NextRequest) {
  if (!hasAdminKey()) return NextResponse.json({ skipped: "SUPABASE_SECRET_KEY is not set" });
  const admin = createAdminClient();
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const fromVercel = !!process.env.CRON_SECRET && token === process.env.CRON_SECRET;
  const fromDatabase = !fromVercel && !!token && (await admin.rpc("reminder_secret_ok", { t: token })).data === true;
  if (!fromVercel && !fromDatabase) return NextResponse.json({ error: "Not allowed" }, { status: 401 });

  await addSongLinks(admin, ukToday());
  try {
    return NextResponse.json(await sendDueReminders(admin));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
