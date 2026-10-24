import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/useLoad";
import { formatDay, ukToday } from "@/lib/dates";
import { MEASURES, oneDecimal, spotifyLink, type Album, type DayAverages, type Rating } from "@/lib/types";
import { C, F } from "@/lib/theme";
import { Deck } from "./Sleeve";
import { SpotifyMark } from "./Logo";
import { ScoreForm } from "./ScoreForm";
import { Results, type DayNote } from "./Results";
import { Comments, type Comment } from "./Comments";
import { Button, Empty, Loading, Panel, Screen, T } from "./ui";

type DayAlbum = Album & { profiles: { display_name: string } | null };

type DayData =
  | { album: null }
  | {
      album: DayAlbum;
      number: number;
      ratingCount: number;
      mine: Rating | null;
      avg: DayAverages | null;
      notes: DayNote[];
      comments: Comment[];
      reported: string[];
    };

async function loadDay(day: string, userId: string): Promise<DayData> {
  const today = ukToday();
  const { data: dayRow, error } = await supabase
    .from("album_days")
    .select("day, albums(*, profiles!albums_suggested_by_fkey(display_name))")
    .eq("day", day)
    .maybeSingle();
  if (error) throw new Error("Couldn't load the album. Pull down to try again.");
  const album = (dayRow?.albums ?? null) as unknown as DayAlbum | null;
  if (!album || day > today) return { album: null };

  const [{ count }, { data: countData }, { data: mineRow }, { data: commentRows }, { data: myReports }] = await Promise.all([
    supabase.from("album_days").select("day", { count: "exact", head: true }).lte("day", day),
    supabase.rpc("rating_count", { d: day }),
    supabase.from("ratings").select("*").eq("user_id", userId).eq("day", day).maybeSingle(),
    supabase
      .from("comments")
      .select("id, user_id, body, created_at, hidden, profiles!comments_user_id_fkey(display_name)")
      .eq("day", day)
      .order("created_at", { ascending: true })
      .limit(300),
    supabase.from("comment_reports").select("comment_id").eq("reporter_id", userId),
  ]);
  const mine = (mineRow ?? null) as Rating | null;

  let avg: DayAverages | null = null;
  let notes: DayNote[] = [];
  if (mine) {
    // Everyone else's scores only become readable once you've given yours.
    const [{ data: avgRow }, { data: noteRows }] = await Promise.all([
      supabase.from("day_averages").select("*").eq("day", day).maybeSingle(),
      supabase
        .from("ratings")
        .select("user_id, note, overall, updated_at, profiles(display_name)")
        .eq("day", day)
        .neq("user_id", userId)
        .not("note", "is", null)
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);
    avg = avgRow as DayAverages | null;
    notes = (noteRows ?? []) as unknown as DayNote[];
  }

  return {
    album,
    number: count ?? 0,
    ratingCount: (countData as number | null) ?? 0,
    mine,
    avg,
    notes,
    comments: (commentRows ?? []) as unknown as Comment[],
    reported: (myReports ?? []).map((r) => r.comment_id as string),
  };
}

export function DayView({ day, showBack = false }: { day: string; showBack?: boolean }) {
  const { session, profile } = useSession();
  const userId = session!.user.id;
  const { data, error, refreshing, refresh, reload } = useLoad(() => loadDay(day, userId), `${day}:${userId}`);
  const today = ukToday();
  const isToday = day === today;

  const back = showBack ? (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.navigate("/archive"))} accessibilityRole="button" style={st.back} hitSlop={8}>
      <Text style={st.backText}>← Back</Text>
    </Pressable>
  ) : null;

  if (!data) {
    return (
      <Screen brand={!showBack} tabs={!showBack} top={back} onRefresh={refresh} refreshing={refreshing}>
        {error ? <Empty title="Couldn't load">{error}</Empty> : <Loading />}
      </Screen>
    );
  }

  if (!data.album) {
    return (
      <Screen brand={!showBack} tabs={!showBack} top={back} onRefresh={refresh} refreshing={refreshing}>
        <Empty title="No album yet">Nothing is scheduled for {formatDay(day, true)}. Check back later.</Empty>
      </Screen>
    );
  }

  const { album, number, ratingCount, mine } = data;
  const editable = !mine || mine.created_day === today;

  return (
    <Screen brand={!showBack} tabs={!showBack} top={back} onRefresh={refresh} refreshing={refreshing}>
      <Deck album={album} number={number} />

      <T v="eyebrow">No. {number} · {formatDay(day)}{isToday ? " · Today" : ""}</T>
      <T v="h1" style={{ marginTop: 6 }} accessibilityRole="header">{album.title}</T>
      <T style={st.artist}>{album.artist}</T>
      <View style={st.facts}>
        {album.release_year ? <Fact label="Released" value={String(album.release_year)} mono /> : null}
        {album.top_song ? <Fact label="Most played" value={album.top_song} /> : null}
        {album.tracks?.length > 0 ? (
          <Fact label={`${album.tracks.length} tracks ·`} value={`${Math.round(album.tracks.reduce((a, t) => a + t.duration_ms, 0) / 60000)} min`} mono />
        ) : null}
        {album.profiles?.display_name ? <Fact label="Suggested by" value={album.profiles.display_name} /> : null}
      </View>

      <Pressable
        onPress={() => Linking.openURL(spotifyLink(album))}
        accessibilityRole="link"
        accessibilityHint="Opens the album in Spotify"
        style={({ pressed }) => [st.listen, pressed && { opacity: 0.8 }]}
      >
        <SpotifyMark size={20} />
        <Text style={st.listenText}>Listen on Spotify</Text>
      </Pressable>
      <T v="small" style={{ marginTop: 8 }}>Play it start to finish, then come back and score it.</T>

      {mine && !editable ? (
        <Panel title="Your scores" sub="Scores lock at midnight UK time on the day you give them.">
          <View style={st.locked}>
            {MEASURES.map((m) => (
              <View key={m.key} style={st.ls}>
                <T style={{ fontSize: 11, lineHeight: 14, color: C.muted }}>{m.short}</T>
                <T style={{ fontFamily: F.monoBold, fontSize: 20, lineHeight: 26 }}>{m.key === "nostalgia" && mine.new_to_me ? "–" : oneDecimal(mine[m.key])}</T>
              </View>
            ))}
          </View>
          {mine.note ? <T style={{ marginTop: 12 }}>{mine.note}</T> : null}
        </Panel>
      ) : (
        <ScoreForm key={mine?.updated_at ?? "new"} day={day} userId={userId} isToday={isToday} mine={mine} onSaved={reload} />
      )}

      {mine ? (
        <Results mine={mine} avg={data.avg} notes={data.notes} isToday={isToday} />
      ) : (
        <Panel title={isToday ? "Today's scores" : "Scores for this day"}>
          <T v="muted" style={{ marginTop: 8 }}>
            {ratingCount ? `${ratingCount} ${ratingCount === 1 ? "person has" : "people have"} scored this.` : "Nobody has scored this yet."} The averages appear once you&apos;ve given yours.
          </T>
        </Panel>
      )}

      <Comments
        day={day}
        userId={userId}
        isAdmin={!!profile?.is_admin}
        isBlocked={!!profile?.is_blocked}
        hasScored={!!mine}
        comments={data.comments}
        reported={data.reported}
        onChange={reload}
      />

      {!isToday && (
        <View style={{ marginTop: 24, alignItems: "flex-start" }}>
          <Button kind="ghost" small label="Go to today's album" onPress={() => router.navigate("/")} />
        </View>
      )}
    </Screen>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <T v="muted">
      {label} <T style={{ fontFamily: mono ? F.monoBold : F.semibold, fontSize: 14 }}>{value}</T>
    </T>
  );
}

const st = StyleSheet.create({
  back: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  backText: { fontFamily: F.semibold, fontSize: 16, color: C.ink },
  artist: { fontFamily: F.semibold, fontSize: 19, lineHeight: 24, marginTop: 6 },
  facts: { flexDirection: "row", flexWrap: "wrap", columnGap: 18, rowGap: 4, marginTop: 12 },
  listen: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 10, marginTop: 18, paddingVertical: 13, paddingHorizontal: 20, borderRadius: 999, backgroundColor: C.orange, minHeight: 48 },
  listenText: { fontFamily: F.bold, fontSize: 16, color: C.onOrange },
  locked: { flexDirection: "row", gap: 8, marginTop: 14 },
  ls: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: C.bg },
});
