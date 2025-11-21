import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Primary, Secondary } from './ui';
import { supabase } from '../lib/supabase';
import BackButton from './BackButton';
import { Pressable } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../lib/appContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { useThemeMode } from '../lib/themeMode';

type P = NativeStackScreenProps<RootStackParamList, 'AddHome'>;

export default function AddHome({ navigation, route }: P) {
  const homeId = (route as any)?.params?.homeId as string | undefined;
  const [nickname, setNick] = useState('');
  const [country, setCountry] = useState('');
  const [regionState, setRegionState] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floors, setFloors] = useState('');
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState('');
  const [moveInYear, setMoveInYear] = useState('');
  const qc = useQueryClient();
  const { refresh } = useApp();
  const { colors } = useThemeMode();

  const goBackSafe = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('GetStarted');
  };

  async function geocode(addr: string) {
    if (!addr) return null;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Maintainly/1.0 (contact: app@example.com)' } });
      const json: any[] = await res.json();
      if (json && json.length) {
        return { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) };
      }
    } catch {}
    return null;
  }

  async function saveHome(next: 'add' | 'finish') {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in.');

      const nick = nickname.trim();
      const ctry = country.trim();
      const st   = regionState.trim();
      const cty  = city.trim();

      if (!nick) throw new Error('Nickname is required.');
      if (!cty || !st || !ctry) throw new Error('City, State, and Country are required.');

      let data: any;
      // Geocode full address if available (nickname + address field or city/state)
      let coords: { lat: number; lon: number } | null = null;
      const fullAddress = address || `${cty}, ${st} ${zip} ${ctry}`;
      coords = await geocode(fullAddress);

        if (homeId) {
        const { data: upd, error: uErr } = await supabase
          .from('homes')
          .update({
            nickname: nick,
            country: ctry,
            state: st,
            city: cty,
            zip: zip.trim() || null,
            bedrooms: bedrooms ? Number(bedrooms) : null,
            bathrooms: bathrooms ? Number(bathrooms) : null,
            floors: floors ? Number(floors) : null,
              // NOTE: lat/lon columns may not exist in some databases. Omit them to avoid schema errors.
              // When your database has `lat` and `lon` on `homes`, re-enable these assignments.
            // lat: coords?.lat ?? null,
            // lon: coords?.lon ?? null,
            move_in_year: moveInYear ? Number(moveInYear) : null,
          })
          .eq('id', homeId)
          .select('id, nickname, city, state, country')
          .single();
        if (uErr) throw uErr;
        data = upd;
      } else {
        const { data: ins, error: iErr } = await supabase
          .from('homes')
          .insert({
            user_id: user.id,
            nickname: nick,
            country: ctry,
            state: st,
            city: cty,
            zip: zip.trim() || null,
            bedrooms: bedrooms ? Number(bedrooms) : null,
            bathrooms: bathrooms ? Number(bathrooms) : null,
            floors: floors ? Number(floors) : null,
            // lat/lon omitted intentionally to avoid errors if DB schema hasn't been migrated yet
            // lat: coords?.lat ?? null,
            // lon: coords?.lon ?? null,
            move_in_year: moveInYear ? Number(moveInYear) : null,
          })
          .select('id, nickname, city, state, country')
          .single();
        if (iErr) throw iErr;
        data = ins;
      }

      // Keep profile in sync so the AI always has a fallback location + the “last home”
      const { error: pErr } = await supabase.from('profiles').upsert({
        user_id: user.id,
        last_home_id: data.id,
        city: data.city,
        state: data.state,
        country: data.country,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (pErr) throw pErr;

      await qc.invalidateQueries({ queryKey: ['homes'] });
      await qc.invalidateQueries({ queryKey: ['maintenance-plan', data.id] });
      await refresh();

      if (!homeId) {
        if (next === 'add') navigation.replace('QuickAddAppliances', { homeId: data.id });
        else navigation.replace('HomeDashboard', { homeId: data.id });
      } else {
        navigation.replace('HomeDashboard', { homeId: data.id });
      }
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function suggestMoveIn() {
    const y = new Date().getFullYear() - 1;
    setMoveInYear(String(y));
    Alert.alert('Suggested', `We guessed your move-in year might be ${y}. You can change it.`);
  }

  function parseAddress(val: string) {
    setAddress(val);
    try {
      const parts = val.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const last = parts[parts.length - 1];
        // Expect last part maybe 'FL 33913' with state + zip
        const m = last.match(/([A-Za-z]{2})\s+(\d{5})/);
        if (m) {
          if (!regionState) setRegionState(m[1].toUpperCase());
          if (!zip) setZip(m[2]);
          if (!city && parts.length >= 2) setCity(parts[parts.length - 2]);
          if (!country) setCountry('USA');
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (homeId) {
      (async () => {
        const { data } = await supabase.from('homes').select('*').eq('id', homeId).maybeSingle();
        if (data) {
          setNick(data.nickname || '');
          setCountry(data.country || '');
          setRegionState(data.state || '');
          setCity(data.city || '');
          setZip(data.zip || '');
          setBedrooms(data.bedrooms ? String(data.bedrooms) : '');
          setBathrooms(data.bathrooms ? String(data.bathrooms) : '');
          setFloors(data.floors ? String(data.floors) : '');
          setMoveInYear(data.move_in_year ? String(data.move_in_year) : '');
        }
      })();
    }
  }, [homeId]);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={goBackSafe} />
        <Text style={[s.title, { color: colors.text }]}>{homeId ? 'Edit Home' : 'Add a Home'}</Text>
        <View style={{ width:64 }} />
      </View>

      <View style={s.card}>
        <Input placeholder="Nickname" value={nickname} onChangeText={setNick} />
        <Input placeholder="Address (optional)" value={address} onChangeText={parseAddress} />
        <Input placeholder="Country" value={country} onChangeText={setCountry} />
        <Input placeholder="State" value={regionState} onChangeText={setRegionState} />
        <Input placeholder="City" value={city} onChangeText={setCity} />
        <Input placeholder="Zip Code" value={zip} onChangeText={setZip} keyboardType="number-pad" />
        <View style={{ flexDirection:'row', gap:10 }}>
          <Input placeholder="Move-in Year (optional)" value={moveInYear} onChangeText={setMoveInYear} keyboardType="number-pad" />
        </View>
        <Text style={[s.hint, { color: colors.textDim }]}>Address and move-in year improve suggestions. Geocoding runs automatically when saved.</Text>
        <Pressable onPress={suggestMoveIn} style={s.link}><Text style={s.linkText}>Suggest move-in year</Text></Pressable>
        <Input placeholder="Bedrooms" value={bedrooms} onChangeText={setBedrooms} keyboardType="number-pad" />
        <Input placeholder="Bathrooms" value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" />
        <Input placeholder="Floors" value={floors} onChangeText={setFloors} keyboardType="number-pad" />

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          {homeId ? (
            <Primary title={saving ? 'Saving…' : 'Save'} onPress={() => saveHome('finish')} disabled={saving} />
          ) : (
            <>
              <Secondary title="Finish" onPress={() => saveHome('finish')} />
              <Primary title={saving ? 'Saving…' : 'Next'} onPress={() => saveHome('add')} disabled={saving} />
            </>
          )}
        </View>
      </View>
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  card: { gap: 10 },
  hint: {},
  link: { alignSelf:'flex-start' },
  linkText: { color:'#00B1F2', fontWeight:'700' }
});
