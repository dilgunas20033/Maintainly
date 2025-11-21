// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

type Extra = { supabase?: { url?: string; anonKey?: string } };
const extra = (Constants.expoConfig?.extra as Extra) || {};

const url = extra.supabase?.url || process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = extra.supabase?.anonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Diagnostic logging (non-sensitive): show host + key length for troubleshooting auth issues.
try {
  if (url) {
    const host = (() => { try { return new URL(url).host; } catch { return 'invalid-url'; } })();
    console.log(`Supabase URL host: ${host}`);
  }
  if (anon) {
    console.log(`Supabase anon key length: ${anon.length}`);
  }
  if (!url || !anon) {
    console.error('❌ Supabase config missing. Check .env and app.config.js');
  }
} catch (e) {
  console.warn('Supabase env diagnostic failed', e);
}

let _supabase: any = null;
if (url && anon) {
  _supabase = createClient(url!, anon!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
} else {
  // Lightweight stub for test/dev environments when env vars are not present.
  // Methods implemented are minimal and intentionally forgiving for tests.
  const noop = async (..._args: any[]) => ({ data: null, error: null });
  _supabase = {
    auth: {
      signUp: noop,
      signInWithPassword: noop,
      getUser: async () => ({ data: { user: null } }),
    },
    from: (_table: string) => ({
      insert: noop,
      select: async () => ({ data: [], error: null }),
      update: noop,
      upsert: noop,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
      eq: () => ({ select: async () => ({ data: null, error: null }) })
    })
  };
}

export const supabase = _supabase;
