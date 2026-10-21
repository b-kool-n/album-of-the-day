"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/supabase/server";
import { submitSuggestion } from "@/lib/suggest";

export type SuggestState = { error?: string; done?: string; at?: number };

export async function suggestAlbum(_prev: SuggestState, formData: FormData): Promise<SuggestState> {
  const { supabase, userId } = await getViewer();
  if (!userId) return { error: "Sign in to suggest an album." };

  const result = await submitSuggestion(supabase, userId, String(formData.get("link") ?? ""), String(formData.get("reason") ?? ""));
  if ("error" in result) return result;

  revalidatePath("/suggest");
  revalidatePath("/", "layout");
  return { done: result.done, at: Date.now() };
}

export async function withdrawSuggestion(formData: FormData) {
  const { supabase, userId } = await getViewer();
  if (!userId) return;
  const id = String(formData.get("id") ?? "");
  await supabase.from("submissions").delete().eq("id", id).eq("user_id", userId).eq("status", "pending");
  revalidatePath("/suggest");
  revalidatePath("/", "layout");
}
