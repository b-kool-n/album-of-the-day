import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { formatWhen, ukToday } from "@/lib/dates";
import { C, F } from "@/lib/theme";
import { Button, Field, Message, Panel, T } from "./ui";

export type Comment = { id: string; user_id: string; body: string; created_at: string; hidden: boolean; profiles: { display_name: string } | null };
export type Reaction = { comment_id: string; user_id: string; emoji: string };

export const EMOJI = ["🔥", "❤️", "😂", "👍"] as const;

type Props = {
  day: string;
  userId: string;
  isAdmin: boolean;
  isBlocked: boolean;
  hasScored: boolean;
  comments: Comment[];
  reported: string[];
  reactions: Reaction[];
  onChange: () => void;
};

export function Comments({ day, userId, isAdmin, isBlocked, hasScored, comments, reported, reactions, onChange }: Props) {
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
            <CommentRow key={c.id} c={c} day={day} userId={userId} isAdmin={isAdmin} canReact={!isBlocked} alreadyReported={reported.includes(c.id)} reactions={reactions.filter((r) => r.comment_id === c.id)} onChange={onChange} />
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

type RowProps = { c: Comment; day: string; userId: string; isAdmin: boolean; canReact: boolean; alreadyReported: boolean; reactions: Reaction[]; onChange: () => void };

function CommentRow({ c, userId, isAdmin, canReact, alreadyReported, reactions, onChange }: RowProps) {
  const mine = c.user_id === userId;
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(alreadyReported);

  function confirmBlock() {
    const name = c.profiles?.display_name || "this person";
    const run = async () => {
      await supabase.from("user_blocks").insert({ blocker_id: userId, blocked_id: c.user_id });
      onChange();
    };
    if (Platform.OS === "web") return void run();
    Alert.alert(`Block ${name}?`, "You won't see their comments or notes any more. They won't be told. You can unblock them from Account.", [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: run },
    ]);
  }

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
      <Reactions key={reactions.map((r) => r.user_id + r.emoji).join()} commentId={c.id} userId={userId} initial={reactions} canReact={canReact} />
      <View style={st.actions}>
        {(mine || isAdmin) && <Button kind="link" label="Delete" onPress={confirmDelete} />}
        {!mine && (sent ? <T v="small">Reported. Thanks.</T> : !reporting && <Button kind="link" label="Report" onPress={() => setReporting(true)} />)}
        {!mine && <Button kind="link" label="Block" onPress={confirmBlock} />}
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

// Four quick reactions under each comment. Tap to add yours, tap again to take it back.
function Reactions({ commentId, userId, initial, canReact }: { commentId: string; userId: string; initial: Reaction[]; canReact: boolean }) {
  const [list, setList] = useState(initial);

  async function toggle(emoji: string) {
    if (!canReact) return;
    const had = list.some((r) => r.user_id === userId && r.emoji === emoji);
    if (Platform.OS !== "web") Haptics.selectionAsync();
    // Show the change straight away, then save it.
    setList((l) => (had ? l.filter((r) => !(r.user_id === userId && r.emoji === emoji)) : [...l, { comment_id: commentId, user_id: userId, emoji }]));
    const { error } = had
      ? await supabase.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", userId).eq("emoji", emoji)
      : await supabase.from("comment_reactions").insert({ comment_id: commentId, user_id: userId, emoji });
    if (error) setList(initial);
  }

  return (
    <View style={st.reactions}>
      {EMOJI.map((e) => {
        const count = list.filter((r) => r.emoji === e).length;
        const mineOn = list.some((r) => r.user_id === userId && r.emoji === e);
        return (
          <Pressable
            key={e}
            onPress={() => toggle(e)}
            disabled={!canReact}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityState={{ selected: mineOn }}
            accessibilityLabel={`${EMOJI_NAMES[e]}, ${count}`}
            style={({ pressed }) => [st.reaction, mineOn && st.reactionOn, pressed && { opacity: 0.7 }]}
          >
            <Text style={st.reactionEmoji}>{e}</Text>
            {count > 0 && <Text style={[st.reactionCount, mineOn && { color: C.orange }]}>{count}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const EMOJI_NAMES: Record<string, string> = { "🔥": "Fire", "❤️": "Love", "😂": "Laughing", "👍": "Thumbs up" };

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
  reactions: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  reaction: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: C.line, minHeight: 32 },
  reactionOn: { borderColor: C.orange, backgroundColor: C.soft },
  reactionEmoji: { fontSize: 15 },
  reactionCount: { fontFamily: F.monoBold, fontSize: 12, color: C.muted },
});
