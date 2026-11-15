"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
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
  const { error } = await createAdminClient()
    .from("feedback")
    .insert({ user_id: userId, body, contact_email: email, sender_key: await senderKey() });
  if (error) return { error: error.message.includes("too_many_messages") ? "You've sent a few messages in the last hour. Try again later." : "Couldn't send it. Try again." };
  revalidatePath("/", "layout");
  return { done: "Thanks. Your message has been sent. Replies come from the person who runs Album of the Day, usually within a couple of days." };
}

// A scrambled form of the sender's internet address, so the database can limit how many messages
// come from one place. It can't be turned back into the address, and it's cleared after a day.
async function senderKey(): Promise<string | null> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  if (!ip || !process.env.SUPABASE_SECRET_KEY) return null;
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY).update(`support:${ip}`).digest("hex").slice(0, 32);
}
