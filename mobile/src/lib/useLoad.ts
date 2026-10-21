import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

// Loads a screen's data, reloads it each time the screen comes back into view,
// and gives pull-to-refresh something to call.
export function useLoad<T>(load: () => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const run = useCallback(async () => {
    try {
      const result = await loadRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this. Pull down to try again.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      run();
      // `key` is listed so the screen reloads when what it shows changes (another day, another person).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, key]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return { data, error, refreshing, refresh, reload: run };
}
