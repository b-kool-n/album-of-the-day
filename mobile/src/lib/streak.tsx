import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { supabase } from "./supabase";
import { useSession } from "./session";
import { addDays, ukToday } from "./dates";

// A day counts towards the streak when you score that day's album on the day itself.
// Late scores don't count. Days with no album scheduled are skipped, so they don't break it.
export type Streak = {
  current: number;
  best: number;
  scoredToday: boolean;
  /** Days scored on the day, for the last-4-weeks dots. */
  onDay: Set<string>;
  /** Days that had an album. */
  albumDays: Set<string>;
};

const EMPTY: Streak = { current: 0, best: 0, scoredToday: false, onDay: new Set(), albumDays: new Set() };

export function workOutStreak(onDayList: string[], albumDayList: string[], today: string): Streak {
  const onDay = new Set(onDayList);
  const albumDays = new Set(albumDayList.filter((d) => d <= today));
  const ordered = [...albumDays].sort();
  const scoredToday = onDay.has(today);

  // Current: walk back through days that had an album, starting today (or yesterday if today isn't scored yet).
  let current = 0;
  for (let i = ordered.length - 1; i >= 0; i--) {
    const d = ordered[i];
    if (d === today && !scoredToday) continue;
    if (onDay.has(d)) current++;
    else break;
  }

  let best = 0;
  let run = 0;
  for (const d of ordered) {
    run = onDay.has(d) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, best: Math.max(best, current), scoredToday, onDay, albumDays };
}

const StreakContext = createContext<{ streak: Streak; refreshStreak: () => Promise<void> }>({ streak: EMPTY, refreshStreak: async () => {} });

export function StreakProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [streak, setStreak] = useState<Streak>(EMPTY);

  const load = useCallback(async (): Promise<Streak> => {
    if (!userId) return EMPTY;
    const today = ukToday();
    const [{ data: mine }, { data: days }] = await Promise.all([
      supabase.from("ratings").select("day").eq("user_id", userId).eq("late", false),
      supabase.from("album_days").select("day").lte("day", today).gte("day", addDays(today, -400)),
    ]);
    return workOutStreak(
      (mine ?? []).map((r) => r.day as string),
      (days ?? []).map((r) => r.day as string),
      today,
    );
  }, [userId]);

  const refreshStreak = useCallback(async () => {
    setStreak(await load());
  }, [load]);

  useEffect(() => {
    let live = true;
    load().then((s) => live && setStreak(s));
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") load().then((s) => live && setStreak(s));
    });
    return () => {
      live = false;
      sub.remove();
    };
  }, [load]);

  return <StreakContext.Provider value={{ streak, refreshStreak }}>{children}</StreakContext.Provider>;
}

export function useStreak() {
  return useContext(StreakContext);
}
