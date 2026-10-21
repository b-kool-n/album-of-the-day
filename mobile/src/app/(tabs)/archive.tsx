import { View } from "react-native";
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
  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <T v="title" style={{ marginTop: 20 }} accessibilityRole="header">Archive</T>
      <T v="muted" style={{ marginTop: 4 }}>Every album so far. Missed one? Open it to listen and add a late score.</T>
      <View style={{ marginTop: 10 }}>
        {data.rows.map((r, i) => {
          const n = data.countBy.get(r.day) ?? 0;
          const me = data.mineBy.get(r.day);
          const isToday = r.day === data.today;
          return (
            <AlbumRow
              key={r.day}
              album={r.albums}
              day={r.day}
              label={`Number ${total - i}, ${formatDay(r.day)}: ${r.albums.title} by ${r.albums.artist}.${me != null ? ` Average ${oneDecimal(data.avgBy.get(r.day))}, you gave it ${oneDecimal(me)}.` : " Not scored by you yet."}`}
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
                <T style={{ fontFamily: F.mono, fontSize: 12, lineHeight: 16, color: C.muted }}>No. {total - i} · {formatDay(r.day)}</T>
                {isToday && <Chip label="Today" hot />}
              </View>
              <T style={{ fontFamily: F.bold }} numberOfLines={2}>{r.albums.title}</T>
              <T v="muted" numberOfLines={1}>{r.albums.artist}{r.albums.release_year ? ` · ${r.albums.release_year}` : ""}</T>
            </AlbumRow>
          );
        })}
      </View>
    </Screen>
  );
}
