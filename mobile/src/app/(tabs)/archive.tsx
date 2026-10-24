import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CoverGrid } from "@/components/CoverGrid";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/useLoad";
import { formatDay, ukToday } from "@/lib/dates";
import { oneDecimal, type Album, type DayAverages } from "@/lib/types";
import { C, F } from "@/lib/theme";
import { AlbumRow } from "@/components/AlbumRow";
import { Chip, Empty, Loading, Screen, T } from "@/components/ui";

type DayRow = { day: string; albums: Pick<Album, "artist" | "title" | "release_year" | "cover_url"> };

export default function Archive() {
  const { session } = useSession();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "shelf">(savedView);
  function changeView(v: "list" | "shelf") {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // Only a convenience.
    }
  }
  const userId = session!.user.id;
  const { data, error, refreshing, refresh } = useLoad(async () => {
    const today = ukToday();
    const [{ data: days, error: e }, { data: counts }, { data: avgs }, { data: mine }] = await Promise.all([
      supabase.from("album_days").select("day, albums(artist, title, release_year, cover_url)").lte("day", today).order("day", { ascending: false }),
      supabase.rpc("released_day_counts"),
      supabase.from("day_averages").select("day, overall"),
      supabase.from("ratings").select("day, overall").eq("user_id", userId),
    ]);
    if (e) throw new Error("Couldn't load the archive. Pull down to try again.");
    return {
      today,
      rows: (days ?? []) as unknown as DayRow[],
      countBy: new Map(((counts ?? []) as { day: string; ratings: number }[]).map((c) => [c.day, c.ratings])),
      avgBy: new Map(((avgs ?? []) as Pick<DayAverages, "day" | "overall">[]).map((a) => [a.day, a.overall])),
      mineBy: new Map(((mine ?? []) as { day: string; overall: number }[]).map((r) => [r.day, r.overall])),
    };
  }, userId);

  if (!data) {
    return <Screen onRefresh={refresh} refreshing={refreshing}>{error ? <Empty title="Couldn't load">{error}</Empty> : <Loading />}</Screen>;
  }
  if (!data.rows.length) {
    return <Screen onRefresh={refresh} refreshing={refreshing}><Empty title="No albums yet">Past albums appear here once the first day has run.</Empty></Screen>;
  }

  const total = data.rows.length;
  // Number each album by its place in the whole run, before any search narrows the list.
  const numbered = data.rows.map((r, i) => ({ ...r, no: total - i }));
  const q = search.trim().toLowerCase();
  const shown = q ? numbered.filter((r) => r.albums.title.toLowerCase().includes(q) || r.albums.artist.toLowerCase().includes(q)) : numbered;
  const open = (day: string) => (day === data.today ? router.navigate("/") : router.push({ pathname: "/day/[date]", params: { date: day } }));

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <T v="title" style={{ marginTop: 20 }} accessibilityRole="header">Archive</T>
      <T v="muted" style={{ marginTop: 4 }}>Every album so far. Missed one? Open it to listen and add a late score.</T>

      <View style={st.controls}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search artist or album"
          placeholderTextColor="#6b6b6b"
          selectionColor={C.orange}
          keyboardAppearance="dark"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          accessibilityLabel="Search artist or album"
          style={st.search}
        />
        <View style={st.toggle} accessibilityRole="tablist">
          {(["list", "shelf"] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => changeView(v)}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === v }}
              style={[st.toggleBtn, view === v && st.toggleOn]}
            >
              <Text style={[st.toggleText, view === v && { color: C.onOrange }]}>{v === "list" ? "List" : "Shelf"}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {shown.length === 0 ? (
        <T v="muted" style={{ marginTop: 16 }}>Nothing matches &ldquo;{search.trim()}&rdquo;.</T>
      ) : view === "shelf" ? (
        <View style={{ marginTop: 14 }}>
          <CoverGrid
            items={shown.map((r) => {
              const me = data.mineBy.get(r.day);
              return {
                key: r.day,
                album: r.albums,
                badge: me != null ? oneDecimal(me) : `No. ${r.no}`,
                hot: me != null,
                caption: r.albums.title,
                label: `Number ${r.no}, ${formatDay(r.day)}: ${r.albums.title} by ${r.albums.artist}.${me != null ? ` You gave it ${oneDecimal(me)}.` : " Not scored by you yet."}`,
                onPress: () => open(r.day),
              };
            })}
          />
          <T v="small" style={{ marginTop: 10 }}>Orange labels are your scores.</T>
        </View>
      ) : (
      <View style={{ marginTop: 10 }}>
        {shown.map((r) => {
          const n = data.countBy.get(r.day) ?? 0;
          const me = data.mineBy.get(r.day);
          const isToday = r.day === data.today;
          return (
            <AlbumRow
              key={r.day}
              album={r.albums}
              day={r.day}
              label={`Number ${r.no}, ${formatDay(r.day)}: ${r.albums.title} by ${r.albums.artist}.${me != null ? ` Average ${oneDecimal(data.avgBy.get(r.day))}, you gave it ${oneDecimal(me)}.` : " Not scored by you yet."}`}
              right={
                me != null ? (
                  <>
                    <T style={{ fontFamily: F.monoBold, fontSize: 22, lineHeight: 26 }}>{oneDecimal(data.avgBy.get(r.day))}</T>
                    <T style={{ fontFamily: F.mono, fontSize: 12, lineHeight: 16, color: C.muted }}>{n} scored · you {oneDecimal(me)}</T>
                  </>
                ) : (
                  <>
                    <T style={{ fontFamily: F.mono, fontSize: 12, lineHeight: 16, color: C.muted }}>{n ? `${n} scored` : "No scores yet"}</T>
                    <Chip label="Score it" hot />
                  </>
                )
              }
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <T style={{ fontFamily: F.mono, fontSize: 12, lineHeight: 16, color: C.muted }}>No. {r.no} · {formatDay(r.day)}</T>
                {isToday && <Chip label="Today" hot />}
              </View>
              <T style={{ fontFamily: F.bold }} numberOfLines={2}>{r.albums.title}</T>
              <T v="muted" numberOfLines={1}>{r.albums.artist}{r.albums.release_year ? ` · ${r.albums.release_year}` : ""}</T>
            </AlbumRow>
          );
        })}
      </View>
      )}
    </Screen>
  );
}

const VIEW_KEY = "archive_view";
function savedView(): "list" | "shelf" {
  try {
    return localStorage.getItem(VIEW_KEY) === "shelf" ? "shelf" : "list";
  } catch {
    return "list";
  }
}

const st = StyleSheet.create({
  controls: { flexDirection: "row", gap: 10, marginTop: 16, alignItems: "center" },
  search: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 10, backgroundColor: C.surface, color: C.ink, fontFamily: F.regular, fontSize: 16, paddingHorizontal: 12, paddingVertical: 10 },
  toggle: { flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 999, padding: 3 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  toggleOn: { backgroundColor: C.orange },
  toggleText: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
});
