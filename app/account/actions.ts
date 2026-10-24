"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { createAdminClient, SECRET_KEY_MISSING, hasAdminKey } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/push";

export type FormState = { error?: string; done?: string; at?: number };

const BANNED = "That includes a word that isn't allowed here. Please reword it.";

export async function updateName(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await getViewer();
  if (!userId) return { error: "Sign in first." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 40) return { error: "Use a name between 1 and 40 characters." };
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", userId);
  if (error) return { error: error.message.includes("banned_words") ? BANNED : "Couldn't save your name. Try again." };
  revalidatePath("/", "layout");
  return { done: "Saved. Your comments and notes now show this name." };
}

export async function sendFeedback(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await getViewer();
  if (!userId) return { error: "Sign in first." };
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };
  if (body.length > 2000) return { error: "Keep it under 2,000 characters." };
  const { error } = await supabase.from("feedback").insert({ user_id: userId, body });
  if (error) return { error: "Couldn't send it. Try again." };
  revalidatePath("/", "layout");
  return { done: "Thanks. Your feedback has gone to the curator.", at: Date.now() };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await getViewer();
  if (!userId) return { error: "Sign in first." };
  if (formData.get("confirm") !== "on") return { error: "Tick the box to confirm." };
  if (!hasAdminKey()) return { error: "Account deletion isn't switched on yet. Ask the curator, or try again later." };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "Couldn't delete your account. Try again." };
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?deleted=1");
}

// ===== Tour =====

export async function markTourSeen() {
  const { supabase, userId } = await getViewer();
  if (!userId) return;
  await supabase.from("profiles").update({ tour_seen: true }).eq("id", userId);
  revalidatePath("/", "layout");
}

export async function replayTour() {
  const { supabase, userId } = await getViewer();
  if (!userId) return;
  await supabase.from("profiles").update({ tour_seen: false }).eq("id", userId);
  revalidatePath("/", "layout");
  redirect("/");
}

// ===== Daily notification =====

type BrowserSubscription = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function savePushSubscription(sub: BrowserSubscription): Promise<FormState> {
  const { userId } = await getViewer();
  if (!userId) return { error: "Sign in first." };
  if (!hasAdminKey()) return { error: SECRET_KEY_MISSING };
  const endpoint = sub.endpoint ?? "";
  if (!endpoint.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) return { error: "Your phone sent an unexpected reply. Try again." };
  const ua = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const admin = createAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .upsert({ user_id: userId, endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: ua }, { onConflict: "endpoint" });
  if (error) return { error: "Couldn't save this device. Try again." };
  revalidatePath("/account");
  return { done: "Notifications are on for this device." };
}

export async function removePushSubscription(endpoint: string): Promise<FormState> {
  const { userId } = await getViewer();
  if (!userId) return { error: "Sign in first." };
  if (!hasAdminKey()) return { error: SECRET_KEY_MISSING };
  await createAdminClient().from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", userId);
  revalidatePath("/account");
  return { done: "Notifications are off for this device." };
}

export async function sendTestPush(): Promise<FormState> {
  const { userId } = await getViewer();
  if (!userId) return { error: "Sign in first." };
  if (!hasAdminKey()) return { error: SECRET_KEY_MISSING };
  const admin = createAdminClient();
  const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  if (!subs?.length) return { error: "No devices are signed up yet. Turn notifications on first." };
  try {
    const r = await sendPush(admin, subs, {
      title: "Album of the Day",
      body: "Notifications are working. You'll get one each morning when the new album is out.",
      url: "/account",
      tag: "test",
    });
    if (r.sentIds.length === 0) return { error: "Your phone didn't accept it. Turn notifications off and on again." };
    return { done: `Sent to ${r.sentIds.length} ${r.sentIds.length === 1 ? "device" : "devices"}. It should arrive in a few seconds.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't send a test notification." };
  }
}

// ===== New password =====

export async function setNewPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await getViewer();
  if (!userId) return { error: "That link has expired. Ask for a new one from the sign-in page." };
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (password !== String(formData.get("confirm") ?? "")) return { error: "The two passwords don't match." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/different|same/i.test(error.message)) return { error: "That's the password you already have. Choose a different one." };
    if (/weak|pwned|leak/i.test(error.message)) return { error: "That password has appeared in a data leak elsewhere. Choose a different one." };
    return { error: "Couldn't save it. Try again." };
  }
  return { done: "Saved. You can use your new password straight away, on the website and in the app." };
}
