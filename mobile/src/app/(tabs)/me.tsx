import { router } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/useLoad";
import { formatDay } from "@/lib/dates";
import { MEASURES, oneDecimal, spotifyLink, type Album, type MeasureKey, type Rating } from "@/lib/types";
import { useStreak } from "@/lib/streak";
import { C, F } from "@/lib/theme";
import { AlbumRow } from "@/components/AlbumRow";
import { CoverGrid } from "@/components/CoverGrid";
import { Button, Chip, Empty, Loading, Screen, T } from "@/components/ui";
import { JoinScreen } from "@/components/Join";

type Row = Rating & { album_days: { albums: Pick<Album, "artist" | "title" | "cover_url" | "spotify_url"> } };

// Signed out: a prompt to make an account instead.
export default function YourScoresTab() {
  const { session } = useSession();
  return session ? <YourScores /> : <JoinScreen title="Your scores" body="Make an account to keep every album you score, your day streak and a shelf of albums to relisten." />;
}

function YourScores() {
  const { session, profile } = useSession();
  const { streak } = useStreak();
  const userId = session!.user.id;
  const { data, error, refreshing, refresh } = useLoad(async () => {
    const { data: rows, error: e } = await supabase
      .from("ratings")
      .select("*, album_days(albums(artist, title, cover_url, spotify_url))")
      .eq("user_id", userId)
      .order("day", { ascending: false });
    if (e) throw new Error("Couldn't load your scores. Pull down to try again.");
    return (rows ?? []) as unknown as Row[];
  }, userId);

  if (!data) {
    return <Screen onRefresh={refresh} refreshing={refreshing}>{error ? <Empty title="Couldn't load">{error}</Empty> : <Loading />}</Screen>;
  }
  if (!data.length) {
    return (
      <Screen onRefresh={refresh} refreshing={refreshing}>
        <Empty title="Nothing scored yet" action={<Button label="Score today's album" onPress={() => router.navigate("/")} />}>
          Every album you score lands here, newest first.
        </Empty>
      </Screen>
    );
  }

  const avg = (key: "overall" | MeasureKey) => {
    const v = data.filter((r) => !(key === "nostalgia" && r.new_to_me) && r[key] != null).map((r) => Number(r[key]));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };

  // Up to six, best first, leaving out anything below 6.
  const shelf = [...data].filter((r) => Number(r.relisten) >= 6).sort((a, b) => Number(b.relisten) - Number(a.relisten) || b.day.localeCompare(a.day)).slice(0, 6);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <T v="title" style={{ marginTop: 20 }} accessibilityRole="header">Your scores</T>
      <T v="muted" style={{ marginTop: 4 }}>Signed in as {profile?.display_name}.</T>
      <View style={st.summary}>
        <Stat k="Albums scored" v={String(data.length)} />
        <Stat k="Your average" v={oneDecimal(avg("overall"))} />
        <Stat k="Day streak" v={String(streak.current)} hot={streak.current > 0} />
      </View>
      <View style={st.measures}>
        {MEASURES.map((m) => (
          <T v="small" key={m.key}>
            {m.short} <T style={{ fontFamily: F.monoBold, fontSize: 13 }}>{oneDecimal(avg(m.key))}</T>
          </T>
        ))}
        <T v="small">
          New to you <T style={{ fontFamily: F.monoBold, fontSize: 13 }}>{data.filter((r) => r.new_to_me).length}</T>
        </T>
        <T v="small">
          Best streak <T style={{ fontFamily: F.monoBold, fontSize: 13 }}>{streak.best}</T>
        </T>
      </View>

      {shelf.length > 0 && (
        <>
          <T v="h2" style={{ marginTop: 28 }} accessibilityRole="header">Relisten shelf</T>
          <T v="muted" style={{ marginTop: 2, marginBottom: 12 }}>Your highest Relistenability scores. Tap one to play it on Spotify.</T>
          <CoverGrid
            items={shelf.map((r) => {
              const a = r.album_days.albums;
              return {
                key: r.day,
                album: a,
                badge: oneDecimal(r.relisten),
                hot: true,
                caption: a.title,
                label: `${a.title} by ${a.artist}, relisten score ${oneDecimal(r.relisten)}. Opens in Spotify.`,
                onPress: () => Linking.openURL(spotifyLink(a)),
              };
            })}
          />
        </>
      )}

      <T v="h2" style={{ marginTop: 28 }} accessibilityRole="header">Everything you&apos;ve scored</T>
      <View style={{ marginTop: 10 }}>
        {data.map((r) => {
          const a = r.album_days.albums;
          return (
            <AlbumRow
              key={r.day}
              album={a}
              day={r.day}
              label={`${a.title} by ${a.artist}. You gave it ${oneDecimal(r.overall)}.`}
              right={
                <>
                  <T style={{ fontFamily: F.monoBold, fontSize: 22, lineHeight: 26, color: C.orange }}>{oneDecimal(r.overall)}</T>
                  <T style={st.date}>{formatDay(r.day)}</T>
                  {(r.new_to_me || r.late) && (
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      {r.new_to_me && <Chip label="New" />}
                      {r.late && <Chip label="Late" />}
                    </View>
                  )}
                </>
              }
            >
              <T style={{ fontFamily: F.bold }} numberOfLines={2}>{a.title}</T>
              <T v="muted" numberOfLines={1}>{a.artist}</T>
              <T style={st.mini}>{MEASURES.map((m) => `${m.short.slice(0, 1)} ${m.key === "nostalgia" && r.new_to_me ? "–" : oneDecimal(r[m.key])}`).join(" · ")}</T>
              {r.note ? <T style={{ fontSize: 14, marginTop: 4 }} numberOfLines={3}>{r.note}</T> : null}
            </AlbumRow>
          );
        })}
      </View>
    </Screen>
  );
}

function Stat({ k, v, hot = false }: { k: string; v: string; hot?: boolean }) {
  return (
    <View style={st.stat}>
      <T style={{ fontSize: 12, lineHeight: 16, color: C.muted }}>{k}</T>
      <T style={{ fontFamily: F.monoBold, fontSize: 24, lineHeight: 30, color: hot ? C.orange : C.ink }}>{v}</T>
    </View>
  );
}

const st = StyleSheet.create({
  summary: { flexDirection: "row", gap: 8, marginTop: 18 },
  stat: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12 },
  measures: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4, marginTop: 10 },
  mini: { fontFamily: F.mono, fontSize: 12, lineHeight: 16, color: C.muted, marginTop: 2 },
  date: { fontFamily: F.mono, fontSize: 12, lineHeight: 16, color: C.muted },
});
