import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Home, Profile } from '../types/models';
import { fetchHomes, fetchProfile } from './services';

interface AppState {
  profile: Profile | null;
  homes: Home[];
  currentHomeId: string | null;
  setCurrentHome: (id: string | null) => void;
  refresh: () => Promise<void>;
  sessionChecked: boolean;
  session: any;
}

const AppCtx = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [homes, setHomes] = useState<Home[]>([]);
  const [currentHomeId, setCurrentHomeId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setSessionChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (!session) { setProfile(null); setHomes([]); setCurrentHomeId(null); return; }
    const p = await fetchProfile();
    setProfile(p);
    const h = await fetchHomes();
    setHomes(h);
    if (!currentHomeId) setCurrentHomeId(p?.last_home_id || h[0]?.id || null);
  };

  useEffect(() => {
    if (!session) { setProfile(null); setHomes([]); setCurrentHomeId(null); return; }
    (async () => {
      await refresh();
    })();
  }, [session]);

  const value: AppState = {
    profile,
    homes,
    currentHomeId,
    setCurrentHome: setCurrentHomeId,
    refresh,
    sessionChecked,
    session,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
