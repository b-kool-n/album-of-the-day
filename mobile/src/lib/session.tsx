import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type Profile = { id: string; display_name: string; is_admin: boolean; is_blocked: boolean; created_at: string; tour_seen: boolean; terms_accepted_at: string | null };

type SessionValue = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionValue>({ ready: false, session: null, profile: null, refreshProfile: async () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setReady(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userId) return null;
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, is_admin, is_blocked, created_at, tour_seen, terms_accepted_at")
      .eq("id", userId)
      .maybeSingle();
    return (data as Profile | null) ?? null;
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    const p = await fetchProfile();
    setProfile(p);
    setReady(true);
  }, [fetchProfile]);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetchProfile().then((p) => {
      if (!live) return;
      setProfile(p);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [userId, fetchProfile]);

  return <SessionContext.Provider value={{ ready, session, profile, refreshProfile }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
