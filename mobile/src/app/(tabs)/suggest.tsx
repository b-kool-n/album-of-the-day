import { useState } from "react";
import { View } from "react-native";
import { callWeb, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/useLoad";
import { formatDay, ukToday } from "@/lib/dates";
import { F } from "@/lib/theme";
import { AlbumRow } from "@/components/AlbumRow";
import { Banner, Button, Chip, Field, Loading, Message, Panel, Screen, T } from "@/components/ui";

type Suggestion = {
  id: string;
  artist: string;
  title: string;
  release_year: number | null;
  cover_url: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
  // Only filled in once the album has actually played; future dates stay hidden.
  albums: { album_days: { day: string }[] } | null;
};

export default function Suggest() {
  const { session, profile } = useSession();
  const userId = session!.user.id;
  const [link, setLink] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const { data, refreshing, refresh, reload } = useLoad(async () => {
    const { data: rows } = await supabase
      .from("submissions")
      .select("id, artist, title, release_year, cover_url, reason, status, review_note, created_at, albums!submissions_album_id_fkey(album_days!album_days_album_id_fkey(day))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (rows ?? []) as unknown as Suggestion[];
  }, userId);

  async function send() {
    setError(null);
    setDone(null);
    if (!link.trim()) return setError("Paste a Spotify album link first.");
    setBusy(true);
    try {
      // The website looks the album up on Spotify, then saves the suggestion.
      const r = await callWeb<{ done: string }>("/api/app/suggest", { method: "POST", body: { link: link.trim(), reason } });
      setDone(r.done);
      setLink("");
      setReason("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send it. Try again.");
    }
    setBusy(false);
  }

  async function withdraw(id: string) {
    await supabase.from("submissions").delete().eq("id", id).eq("user_id", userId).eq("status", "pending");
    reload();
  }

  const today = ukToday();
  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {profile?.is_blocked ? (
        <Banner>Your account can&apos;t suggest albums at the moment.</Banner>
      ) : (
        <Panel title="Suggest an album" sub="The curator reviews every suggestion. If it's picked, it goes into the back catalogue and you're credited on the day it plays.">
          <Field
            label="Spotify album link"
            placeholder="https://open.spotify.com/album/…"
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            hint="In Spotify, open the album, then Share → Copy link to album."
          />
          <Field
            label="Why this one? (optional)"
            placeholder="A front-to-back classic, a hidden gem, the one that got you into the band…"
            multiline
            value={reason}
            onChangeText={setReason}
            max={280}
            count={reason.length}
          />
          <View style={{ alignItems: "flex-end", marginTop: 14 }}>
            <Button label={busy ? "Looking it up…" : "Send suggestion"} onPress={send} busy={busy} />
          </View>
          <Message error={error} done={done} />
        </Panel>
      )}

      <T v="h2" style={{ marginTop: 28 }} accessibilityRole="header">Your suggestions</T>
      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <T v="muted" style={{ marginTop: 8 }}>Nothing yet. Albums you suggest appear here with their status.</T>
      ) : (
        <View style={{ marginTop: 6 }}>
          {data.map((s) => {
            const playedOn = s.albums?.album_days.map((d) => d.day).filter((d) => d <= today).sort()[0];
            return (
              <AlbumRow
                key={s.id}
                album={s}
                day={playedOn}
                label={playedOn ? `${s.title} by ${s.artist}. Played on ${formatDay(playedOn)}.` : undefined}
                right={
                  s.status === "pending" ? (
                    <>
                      <Chip label="Waiting" />
                      <Button kind="link" label="Withdraw" onPress={() => withdraw(s.id)} />
                    </>
                  ) : s.status === "approved" ? (
                    <Chip label={playedOn ? "Played" : "Added"} hot />
                  ) : (
                    <Chip label="Not this time" />
                  )
                }
              >
                <T v="small">Suggested {formatDay(s.created_at.slice(0, 10))}</T>
                <T style={{ fontFamily: F.bold }} numberOfLines={2}>{s.title}</T>
                <T v="muted" numberOfLines={1}>{s.artist}{s.release_year ? ` · ${s.release_year}` : ""}</T>
                {s.reason ? <T style={{ fontSize: 14, marginTop: 4 }}>“{s.reason}”</T> : null}
                {s.status === "rejected" && s.review_note ? <T v="muted" style={{ marginTop: 4 }}>Curator: {s.review_note}</T> : null}
                {playedOn ? <T style={{ fontSize: 14, marginTop: 4 }}>Played on {formatDay(playedOn)}</T> : null}
              </AlbumRow>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
