// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

type Extra = { supabase?: { url?: string; anonKey?: string } };
const extra = (Constants.expoConfig?.extra as Extra) || {};

const url = extra.supabase?.url || process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = extra.supabase?.anonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('❌ Supabase config missing. Check .env and app.config.js');
}

export const supabase = createClient(url!, anon!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
