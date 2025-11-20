// Service layer: thin wrappers around Supabase for homes & appliances
// Centralizes table names & shapes for easier future refactors.

import { supabase } from './supabase';
import { Appliance, Home, Profile } from '../types/models';

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function fetchProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  return data as Profile | null;
}

export async function fetchHomes(): Promise<Home[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from('homes')
    .select('id, user_id, nickname, city, state, country, zip, bedrooms, bathrooms, floors, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return (data || []) as Home[];
}

export async function fetchAppliances(homeId: string): Promise<Appliance[]> {
  const { data } = await supabase
    .from('appliances')
    .select('id, user_id, home_id, type, install_year, brand, model, location, created_at')
    .eq('home_id', homeId)
    .order('created_at', { ascending: false });
  return (data || []) as Appliance[];
}

export async function insertHome(payload: Omit<Home, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('homes')
    .insert(payload)
    .select('id, user_id, nickname, city, state, country, created_at')
    .single();
  if (error) throw error;
  return data as Home;
}

export async function insertAppliance(payload: Omit<Appliance, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('appliances')
    .insert(payload)
    .select('id, user_id, home_id, type, install_year, brand, model, location, created_at')
    .single();
  if (error) throw error;
  return data as Appliance;
}
