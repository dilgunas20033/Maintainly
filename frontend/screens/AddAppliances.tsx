import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { Input, Primary, Secondary } from './ui';
import BackButton from './BackButton';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

type P = NativeStackScreenProps<RootStackParamList, 'AddAppliances'>;

const BLUE = '#00B1F2';

// Map common phrases to canonical keys the bot recognizes
const ALIASES: Record<string, string> = {
  'water heater': 'water_heater',
  'water-heater': 'water_heater',
  'hot water heater': 'water_heater',
  'waterheater': 'water_heater',
  'dish washer': 'dishwasher',
  'dishwasher': 'dishwasher',
  'fridge': 'fridge',
  'refrigerator': 'fridge',
  'washing machine': 'washer',
  'washer': 'washer',
  'dryer': 'dryer',
  'hvac': 'hvac',
  'ac': 'ac',
  'a/c': 'ac',
  'air conditioner': 'ac',
  'air-conditioning': 'ac',
  'furnace': 'furnace',
  'boiler': 'boiler',
  'garbage disposal': 'disposal',
  'disposal': 'disposal',
  'oven': 'oven',
  'range': 'oven',
  'stove': 'oven',
  'microwave': 'microwave',
};

function canonicalizeType(raw: string): string {
  const n = raw.toLowerCase().trim().replace(/\s+/g, ' ');
  if (ALIASES[n]) return ALIASES[n];
  // fallback: normalize to snake_case (e.g., "Garage Freezer" → "garage_freezer")
  return n.replace(/[^\w\s-]/g, '').replace(/[\s-]+/g, '_');
}

export default function AddAppliances({ route, navigation }: P) {
  const { homeId } = route.params;
  const { colors } = useThemeMode();

  // Default to dishwasher since you’re testing that flow
  const [type, setType] = useState('dishwasher');
  const [year, setYear] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const canonType = useMemo(() => canonicalizeType(type), [type]);

  function validate(): { ok: boolean; msg?: string; yearNum?: number } {
    if (!canonType) return { ok: false, msg: 'Type is required.' };
    if (year && !/^(19|20)\d{2}$/.test(year)) return { ok: false, msg: 'Year must be like 2018.' };
    const yearNum = year ? Number(year) : null;
    if (yearNum && (yearNum < 1950 || yearNum > new Date().getFullYear() + 1)) {
      return { ok: false, msg: 'Year looks invalid.' };
    }
    return { ok: true, yearNum: yearNum ?? undefined };
  }

  async function addOne() {
    try {
      const v = validate();
      if (!v.ok) return Alert.alert('Fix input', v.msg);
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const payload = {
        user_id: user.id,          // required for RLS
        home_id: homeId,
        type: canonType,           // canonical type the bot will match
        install_year: v.yearNum ?? null,
        brand: brand || null,
        model: model || null,
        location: location || null,
      };

      const { data, error } = await supabase
        .from('appliances')
        .insert(payload)
        .select('id, type, install_year')
        .single();

      if (error) throw error;

      await qc.invalidateQueries({ queryKey: ['appliances', homeId] });
      await qc.invalidateQueries({ queryKey: ['maintenance-plan', homeId] });

      Alert.alert('Added', `Saved ${data.type}${data.install_year ? ` (${data.install_year})` : ''}.`);
      // Clear inputs for the next add
      setType('dishwasher');
      setYear('');
      setBrand('');
      setModel('');
      setLocation('');
    } catch (e: any) {
      Alert.alert('Add failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Add Appliances</Text>
        <View style={{ width:64 }} />
      </View>

      <View style={s.card}>
        <Input placeholder="Type (e.g., dishwasher)" value={type} onChangeText={setType} autoCapitalize="none" />
        <Input placeholder="Year Installed (e.g., 2018)" value={year} onChangeText={setYear} keyboardType="number-pad" />
        <Input placeholder="Brand" value={brand} onChangeText={setBrand} />
        <Input placeholder="Model" value={model} onChangeText={setModel} />
        <Input placeholder="Location (e.g., kitchen, garage)" value={location} onChangeText={setLocation} />

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Secondary title="Finish" onPress={() => navigation.replace('HomeDashboard', { homeId })} />
          <Primary title={saving ? 'Adding…' : 'Add'} onPress={addOne} disabled={saving} />
        </View>

        {/* Tiny helper so you can see what will be stored */}
        <Text style={[s.hint, { color: colors.textDim }]}>Saving as type: <Text style={{ color: BLUE, fontWeight: '700' }}>{canonType}</Text></Text>
      </View>
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  card: { gap: 10 },
  hint: { marginTop: 8, textAlign:'center' },
});
