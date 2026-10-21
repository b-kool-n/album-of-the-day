import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { WEB_URL, callWeb, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/useLoad";
import { formatDay } from "@/lib/dates";
import { notificationsOn, turnOffNotifications, turnOnNotifications } from "@/lib/push";
import { C, F } from "@/lib/theme";
import { Banner, Button, Field, Message, Panel, Screen, T, Toggle } from "@/components/ui";

const BANNED = "That includes a word that isn't allowed here. Please reword it.";

export default function Account() {
  const { session, profile, refreshProfile } = useSession();
  const userId = session!.user.id;
  const email = session!.user.email ?? "–";

  const { data, refreshing, refresh } = useLoad(async () => {
    const [{ count: scored }, { count: suggested }, pushOn] = await Promise.all([
      supabase.from("ratings").select("day", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", userId),
      notificationsOn(),
    ]);
    return { scored: scored ?? 0, suggested: suggested ?? 0, pushOn };
  }, userId);

  async function replayTour() {
    await supabase.from("profiles").update({ tour_seen: false }).eq("id", userId);
    await refreshProfile();
    router.navigate("/");
  }

  async function signOut() {
    // Stop this phone getting notifications for an account that isn't signed in.
    await turnOffNotifications().catch(() => {});
    await supabase.auth.signOut();
  }

  if (!profile) {
    return (
      <Screen onRefresh={refreshProfile} refreshing={false}>
        <T v="muted" style={{ marginTop: 24 }}>Couldn&apos;t load your account. Pull down to try again.</T>
      </Screen>
    );
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <T v="title" style={{ marginTop: 20 }} accessibilityRole="header">Account</T>

      {profile.is_blocked && (
        <Banner>Your account is limited. You can still score albums, but you can&apos;t comment, add notes or suggest albums at the moment.</Banner>
      )}

      <Panel title="Your account">
        <View style={{ marginTop: 10 }}>
          <Fact k="Email" v={email} />
          <Fact k="Joined" v={formatDay(profile.created_at.slice(0, 10), true)} />
          <Fact k="Albums scored" v={data ? String(data.scored) : "–"} mono link={{ label: "See your scores", go: () => router.navigate("/me") }} />
          <Fact k="Albums suggested" v={data ? String(data.suggested) : "–"} mono link={{ label: "Suggest one", go: () => router.navigate("/suggest") }} />
        </View>
        <NameForm userId={userId} name={profile.display_name} onSaved={refreshProfile} />
      </Panel>

      <Panel title="Daily notification" sub="A nudge each morning when the new album is out. Set it up on each phone you use.">
        {data ? <PushSettings initiallyOn={data.pushOn} /> : null}
      </Panel>

      <Panel title="Leave feedback" sub="Goes straight to the curator. Good for bugs, ideas and anything else.">
        <FeedbackForm userId={userId} />
      </Panel>

      <Panel title="Privacy and support">
        <T v="muted" style={{ marginTop: 6 }}>What we store, why, and how to get help.</T>
        <View style={st.inline}>
          <Button kind="ghost" small label="Read the privacy policy" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)} />
          <Button kind="ghost" small label="Replay the tour" onPress={replayTour} />
        </View>
      </Panel>

      {profile.is_admin && (
        <Panel title="Curator" sub="Scheduling albums, reviewing suggestions and moderation stay on the website.">
          <View style={st.inline}>
            <Button kind="ghost" small label="Open Admin on the website" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/admin`)} />
          </View>
        </Panel>
      )}

      <Panel title="Sign out or leave">
        <View style={st.inline}>
          <Button kind="ghost" label="Sign out" onPress={signOut} />
        </View>
        <DeleteAccount onDeleted={signOut} />
      </Panel>
    </Screen>
  );
}

function Fact({ k, v, link, mono = false }: { k: string; v: string; link?: { label: string; go: () => void }; mono?: boolean }) {
  return (
    <View style={st.fact}>
      <T v="muted" style={{ width: 128 }}>{k}</T>
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: 8 }}>
        <T style={mono ? { fontFamily: F.monoBold } : undefined} numberOfLines={1}>{v}</T>
        {link && <Button kind="link" label={link.label} onPress={link.go} />}
      </View>
    </View>
  );
}

function NameForm({ userId, name, onSaved }: { userId: string; name: string; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function save() {
    setError(null);
    setDone(null);
    const n = value.trim();
    if (!n || n.length > 40) return setError("Use a name between 1 and 40 characters.");
    setBusy(true);
    const { error: e } = await supabase.from("profiles").update({ display_name: n }).eq("id", userId);
    setBusy(false);
    if (e) return setError(e.message.includes("banned_words") ? BANNED : "Couldn't save your name. Try again.");
    setDone("Saved. Your comments and notes now show this name.");
    onSaved();
  }

  return (
    <View>
      <Field label="Your name" value={value} onChangeText={setValue} max={40} autoComplete="name" textContentType="name" />
      <View style={st.inline}>
        <Button kind="ghost" small label={busy ? "Saving…" : "Save name"} onPress={save} busy={busy} disabled={value.trim() === name} />
      </View>
      <Message error={error} done={done} />
    </View>
  );
}

function PushSettings({ initiallyOn }: { initiallyOn: boolean }) {
  const [on, setOn] = useState(initiallyOn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function change(next: boolean) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      if (next) {
        await turnOnNotifications();
        setDone("Notifications are on for this phone.");
      } else {
        await turnOffNotifications();
        setDone("Notifications are off for this phone.");
      }
      setOn(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't change notifications. Try again.");
    }
    setBusy(false);
  }

  async function test() {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const r = await callWeb<{ done: string }>("/api/app/test-push", { method: "POST" });
      setDone(r.done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send a test notification.");
    }
    setBusy(false);
  }

  return (
    <View>
      <Toggle label="Morning notification" detail="Around 8am UK time, when the new album is out." value={on} onChange={change} disabled={busy} />
      {on && (
        <View style={st.inline}>
          <Button kind="ghost" small label="Send a test" onPress={test} busy={busy} />
        </View>
      )}
      <Message error={error} done={done} />
    </View>
  );
}

function FeedbackForm({ userId }: { userId: string }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function send() {
    setError(null);
    setDone(null);
    const text = body.trim();
    if (!text) return setError("Write something first.");
    setBusy(true);
    const { error: e } = await supabase.from("feedback").insert({ user_id: userId, body: text });
    setBusy(false);
    if (e) return setError("Couldn't send it. Try again.");
    setBody("");
    setDone("Thanks. Your feedback has gone to the curator.");
  }

  return (
    <View>
      <Field label="Your feedback" multiline value={body} onChangeText={setBody} max={2000} count={body.length} placeholder="What's working, what isn't, what you'd like to see." />
      <View style={st.inline}>
        <Button small label={busy ? "Sending…" : "Send feedback"} onPress={send} busy={busy} />
      </View>
      <Message error={error} done={done} />
    </View>
  );
}

function DeleteAccount({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      await callWeb("/api/app/account", { method: "DELETE", body: { confirm: true } });
      await onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete your account. Try again.");
      setBusy(false);
    }
  }

  function ask() {
    if (!confirm) return setError("Turn on the switch to confirm.");
    if (Platform.OS === "web") return void run();
    Alert.alert("Delete your account?", "Your scores, notes, comments and suggestions will be removed for good.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: run },
    ]);
  }

  return (
    <View style={{ marginTop: 18, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line }}>
      <T style={{ fontFamily: F.semibold }}>Delete your account</T>
      <T v="muted" style={{ marginTop: 4 }}>Removes your account, scores, notes, comments and suggestions straight away. This can&apos;t be undone.</T>
      <Toggle label="I understand. Delete everything." value={confirm} onChange={setConfirm} />
      <View style={st.inline}>
        <Button kind="ghost" label={busy ? "Deleting…" : "Delete my account"} onPress={ask} busy={busy} />
      </View>
      <Message error={error} />
    </View>
  );
}

const st = StyleSheet.create({
  inline: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  fact: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, gap: 8 },
});
