"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/supabase/server";

async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer.profile?.is_admin) throw new Error("Only the curator can do this.");
  return viewer.supabase;
}

function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/moderation");
}

// Keep a reported comment: show it again and clear its reports.
export async function keepComment(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await supabase.from("comment_reports").delete().eq("comment_id", id);
  await supabase.from("comments").update({ hidden: false, report_count: 0 }).eq("id", id);
  refresh();
}

export async function removeComment(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("comments").delete().eq("id", String(formData.get("id") ?? ""));
  refresh();
}

export async function setBlocked(formData: FormData) {
  const supabase = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const blocked = formData.get("blocked") === "true";
  await supabase.rpc("set_blocked", { target: userId, blocked });
  refresh();
}

export async function addBannedWord(formData: FormData) {
  const supabase = await requireAdmin();
  const word = String(formData.get("word") ?? "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  if (word.length >= 2 && word.length <= 40) await supabase.from("banned_words").upsert({ word }, { onConflict: "word" });
  refresh();
}

export async function removeBannedWord(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("banned_words").delete().eq("word", String(formData.get("word") ?? ""));
  refresh();
}

export async function setFeedbackHandled(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await supabase.from("feedback").update({ handled: formData.get("handled") === "true" }).eq("id", id);
  refresh();
}
