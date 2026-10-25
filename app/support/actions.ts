"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/supabase/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";

export type SupportState = { error?: string; done?: string };

// Saves a support message into the curator's feedback list, with a reply address.
// Works signed out, so it's saved by the server rather than through the person's own access.
export async function sendSupport(_prev: SupportState, formData: FormData): Promise<SupportState> {
  if (String(formData.get("website") ?? "")) return { done: "Thanks. Your message has been sent." };
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter an email address so we can reply." };
  if (!body) return { error: "Write a message first." };
  if (body.length > 2000) return { error: "Keep it under 2,000 characters." };
  if (!hasAdminKey()) return { error: "Messages can't be sent right now. Try again later." };

  const { userId } = await getViewer();
  const { error } = await createAdminClient().from("feedback").insert({ user_id: userId, body, contact_email: email });
  if (error) return { error: "Couldn't send it. Try again." };
  revalidatePath("/", "layout");
  return { done: "Thanks. Your message has been sent. Replies come from the person who runs Album of the Day, usually within a couple of days." };
}
