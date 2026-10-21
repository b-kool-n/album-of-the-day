import { useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { formatWhen, ukToday } from "@/lib/dates";
import { C, F } from "@/lib/theme";
import { Button, Field, Message, Panel, T } from "./ui";

export type Comment = { id: string; user_id: string; body: string; created_at: string; hidden: boolean; profiles: { display_name: string } | null };

type Props = {
  day: string;
  userId: string;
  isAdmin: boolean;
  isBlocked: boolean;
  hasScored: boolean;
  comments: Comment[];
  reported: string[];
  onChange: () => void;
};

export function Comments({ day, userId, isAdmin, isBlocked, hasScored, comments, reported, onChange }: Props) {
  // Kept closed until you've scored, so other people's opinions don't sway yours.
  const [show, setShow] = useState(false);
  const n = comments.length;
  const open = hasScored || show;

  return (
    <Panel title={`Comments${n ? ` · ${n}` : ""}`}>
      {n === 0 ? (
        <T v="muted" style={{ marginTop: 8 }}>No comments yet. Start the conversation.</T>
      ) : open ? (
        <View style={{ marginTop: 6 }}>
          {comments.map((c) => (
            <CommentRow key={c.id} c={c} day={day} userId={userId} isAdmin={isAdmin} alreadyReported={reported.includes(c.id)} onChange={onChange} />
          ))}
        </View>
      ) : (
        <View style={{ marginTop: 10, gap: 8, alignItems: "flex-start" }}>
          <T v="muted">You haven&apos;t scored this yet. Comments might sway you.</T>
          <Button kind="ghost" small label={`Show ${n} ${n === 1 ? "comment" : "comments"}`} onPress={() => setShow(true)} />
        </View>
      )}
      {isBlocked ? (
        <T v="muted" style={{ marginTop: 16 }}>Your account can&apos;t post comments at the moment.</T>
      ) : (
        <CommentForm day={day} userId={userId} onPosted={onChange} />
      )}
    </Panel>
  );
}

function CommentRow({ c, day, userId, isAdmin, alreadyReported, onChange }: { c: Comment; day: string; userId: string; isAdmin: boolean; alreadyReported: boolean; onChange: () => void }) {
  const mine = c.user_id === userId;
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(alreadyReported);

  function confirmDelete() {
    const run = async () => {
      await supabase.from("comments").delete().eq("id", c.id);
      onChange();
    };
    if (Platform.OS === "web") return void run();
    Alert.alert("Delete this comment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: run },
    ]);
  }

  async function report() {
    // Reporting twice, or reporting your own comment, is refused by the database and ignored here.
    await supabase.from("comment_reports").insert({ comment_id: c.id, reporter_id: userId, reason: reason.trim().slice(0, 200) || null });
    setSent(true);
    setReporting(false);
    onChange();
  }

  return (
    <View style={[st.comment, c.hidden && { opacity: 0.6 }]}>
      <View style={st.by}>
        <T style={{ fontFamily: F.semibold, flex: 1 }} numberOfLines={1}>{c.profiles?.display_name || "Someone"}{mine ? " (you)" : ""}</T>
        <T style={st.time}>{formatWhen(c.created_at)}</T>
      </View>
      {c.hidden && <T v="small" style={{ marginTop: 2 }}>Hidden from others after reports, until the curator reviews it.</T>}
      <T style={{ marginTop: 4 }}>{c.body}</T>
      <View style={st.actions}>
        {(mine || isAdmin) && <Button kind="link" label="Delete" onPress={confirmDelete} />}
        {!mine && (sent ? <T v="small">Reported. Thanks.</T> : !reporting && <Button kind="link" label="Report" onPress={() => setReporting(true)} />)}
      </View>
      {reporting && (
        <View>
          <Field label="What's wrong with it? (optional)" value={reason} onChangeText={setReason} max={200} />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Button kind="ghost" small label="Send report" onPress={report} />
            <Button kind="link" label="Cancel" onPress={() => setReporting(false)} />
          </View>
        </View>
      )}
    </View>
  );
}

function CommentForm({ day, userId, onPosted }: { day: string; userId: string; onPosted: () => void }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post() {
    const text = body.trim();
    if (!text) return setError("Write something first.");
    if (day > ukToday()) return setError("That day isn't open for comments.");
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.from("comments").insert({ day, user_id: userId, body: text });
    setBusy(false);
    if (e) {
      if (e.message.includes("slow_down")) return setError("You're posting quickly. Wait a few seconds and try again.");
      if (e.message.includes("banned_words")) return setError("That comment includes a word that isn't allowed here. Please reword it.");
      if (e.code === "42501") return setError("Your account can't post comments at the moment.");
      return setError("Couldn't post your comment. Try again.");
    }
    setBody("");
    onPosted();
  }

  return (
    <View style={{ marginTop: 8 }}>
      <Field label="Add a comment" placeholder="Favourite track? Better on the second listen? Say it here." multiline value={body} onChangeText={setBody} max={1000} count={body.length} />
      <View style={{ alignItems: "flex-end", marginTop: 10 }}>
        <Button label={busy ? "Posting…" : "Post"} onPress={post} busy={busy} small />
      </View>
      <Message error={error} />
    </View>
  );
}

const st = StyleSheet.create({
  comment: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  by: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  time: { fontFamily: F.mono, fontSize: 12, color: C.muted },
  actions: { flexDirection: "row", gap: 16, marginTop: 6 },
});
