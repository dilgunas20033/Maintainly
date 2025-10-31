import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { Input, Primary, Secondary } from './ui';
import { supabase } from '../lib/supabase';
import BackButton from './BackButton';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type P = NativeStackScreenProps<RootStackParamList, 'AddHome'>;

export default function AddHome({ navigation }: P) {
  const [nickname, setNick] = useState('');
  const [country, setCountry] = useState('');
  const [regionState, setRegionState] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floors, setFloors] = useState('');
  const [saving, setSaving] = useState(false);

  const goBackSafe = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('GetStarted');
  };

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

      const { data, error } = await supabase
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
        })
        .select('id, nickname, city, state, country')
        .single();
      if (error) throw error;

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

      if (next === 'add') navigation.navigate('AddAppliances', { homeId: data.id });
      else navigation.navigate('HomeDashboard', { homeId: data.id });
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.wrap}>
      <BackButton onPress={goBackSafe} />
      <Text style={s.title}>Add a home</Text>

      <View style={s.card}>
        <Input placeholder="Nickname" value={nickname} onChangeText={setNick} />
        <Input placeholder="Country" value={country} onChangeText={setCountry} />
        <Input placeholder="State" value={regionState} onChangeText={setRegionState} />
        <Input placeholder="City" value={city} onChangeText={setCity} />
        <Input placeholder="Zip Code" value={zip} onChangeText={setZip} keyboardType="number-pad" />
        <Input placeholder="Bedrooms" value={bedrooms} onChangeText={setBedrooms} keyboardType="number-pad" />
        <Input placeholder="Bathrooms" value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" />
        <Input placeholder="Floors" value={floors} onChangeText={setFloors} keyboardType="number-pad" />

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Secondary title="Finish" onPress={() => saveHome('finish')} />
          <Primary title={saving ? 'Saving…' : 'Next'} onPress={() => saveHome('add')} disabled={saving} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'left', top: 40, left: 230 },
  card: { gap: 10, top: 50 },
});
