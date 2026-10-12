"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/supabase/server";
import { isIsoDate, ukToday } from "@/lib/dates";

export type ScoreState = { error?: string; saved?: boolean };

function score(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 10 || Math.round(n * 2) !== n * 2) return NaN;
  return n;
}

export async function saveScores(_prev: ScoreState, formData: FormData): Promise<ScoreState> {
  const { supabase, userId } = await getViewer();
  if (!userId) return { error: "Sign in to save your scores." };

  const day = String(formData.get("day") ?? "");
  if (!isIsoDate(day) || day > ukToday()) return { error: "That day isn't open for scoring." };

  const newToMe = formData.get("new_to_me") === "on";
  const values = {
    back_to_back: score(formData, "back_to_back"),
    vibes: score(formData, "vibes"),
    nostalgia: newToMe ? null : score(formData, "nostalgia"),
    relisten: score(formData, "relisten"),
  };
  const missing = Object.entries(values).some(([k, v]) => (k === "nostalgia" ? !newToMe && (v == null || Number.isNaN(v)) : v == null || Number.isNaN(v)));
  if (missing) return { error: "Each score must be between 0 and 10, in half points." };

  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const row = { ...values, new_to_me: newToMe, note };

  const { data: existing } = await supabase.from("ratings").select("day").eq("user_id", userId).eq("day", day).maybeSingle();
  const { error } = existing
    ? await supabase.from("ratings").update(row).eq("user_id", userId).eq("day", day).select("day").single()
    : await supabase.from("ratings").insert({ ...row, user_id: userId, day }).select("day").single();

  if (error) {
    return {
      error: existing
        ? "Scores lock at midnight UK time on the day you give them, so these can't be changed now."
        : "Couldn't save your scores. Try again.",
    };
  }

  revalidatePath("/");
  revalidatePath(`/day/${day}`);
  revalidatePath("/me");
  revalidatePath("/archive");
  return { saved: true };
}
