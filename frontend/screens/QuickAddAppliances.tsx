import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, TextInput } from 'react-native';
import BackButton from './BackButton';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

type P = NativeStackScreenProps<RootStackParamList, 'QuickAddAppliances'>;

const BLUE = '#00B1F2';

const COMMON: { key: string; label: string }[] = [
  { key: 'dishwasher', label: 'Dishwasher' },
  { key: 'fridge', label: 'Refrigerator' },
  { key: 'washer', label: 'Washing Machine' },
  { key: 'dryer', label: 'Dryer' },
  { key: 'water_heater', label: 'Water Heater' },
  { key: 'ac', label: 'Air Conditioner' },
  { key: 'furnace', label: 'Furnace' },
  { key: 'microwave', label: 'Microwave' },
  { key: 'oven', label: 'Oven/Range' },
  { key: 'disposal', label: 'Garbage Disposal' },
  { key: 'other', label: 'Other' },
];

interface DetailsForm { brand?: string; model?: string; installYear?: string; location?: string }

export default function QuickAddAppliances({ route, navigation }: P) {
  const { homeId } = route.params;
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, DetailsForm>>({});
  const qc = useQueryClient();
  const { colors } = useThemeMode();

  function toggle(key: string) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
    setExpanded(key);
  }

  function changeDetail(key: string, field: keyof DetailsForm, value: string) {
    setDetails(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function onDone() {
    try {
      const picks = Object.keys(selected).filter((k) => selected[k]);
      if (picks.length === 0) return navigation.replace('HomeDashboard', { homeId });
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const rows = picks.map((type) => ({
        user_id: user.id,
        home_id: homeId,
        type,
        brand: details[type]?.brand || null,
        model: details[type]?.model || null,
        location: details[type]?.location || null,
        install_year: details[type]?.installYear ? Number(details[type]!.installYear) : null,
      }));
      const { error } = await supabase.from('appliances').insert(rows);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['appliances', homeId] });
      await qc.invalidateQueries({ queryKey: ['maintenance-plan', homeId] });
      navigation.replace('HomeDashboard', { homeId });
    } catch (e: any) {
      Alert.alert('Failed to add', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Add Basic Appliances</Text>
        <View style={{ width:64 }} />
      </View>
      <Text style={[s.subtitle, { color: colors.textDim }]}>Select the appliances you have. You can edit later.</Text>

      <FlatList
        style={{ marginTop: 8 }}
        data={COMMON}
        keyExtractor={(it) => it.key}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const on = selected[item.key];
          return (
            <View>
              <Pressable onPress={() => toggle(item.key)} style={[s.row, { borderColor: colors.primary }, on && { backgroundColor: colors.bgAlt }]}>
                <Text style={[s.rowText, { color: colors.text }]}>{item.label}</Text>
                <Text style={[s.badge, { borderColor: colors.primary, color: colors.primary }, on && { backgroundColor: colors.primary, color: '#fff' }]}>{on ? '✓' : '+'}</Text>
              </Pressable>
              {on && expanded === item.key && (
                <View style={[s.formWrap, { borderColor: colors.primary, backgroundColor: colors.bgAlt }]}>
                  <Text style={[s.formLabel, { color: colors.text }]}>Details</Text>
                  <View style={s.formRow}>
                    <Text style={[s.formFieldLabel, { color: colors.textDim }]}>Brand</Text>
                    <TextInput value={details[item.key]?.brand || ''} onChangeText={(v)=>changeDetail(item.key,'brand', v)} placeholder="Brand" placeholderTextColor={colors.textDim} style={[s.formInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.primary }]} />
                  </View>
                  <View style={s.formRow}>
                    <Text style={[s.formFieldLabel, { color: colors.textDim }]}>Model</Text>
                    <TextInput value={details[item.key]?.model || ''} onChangeText={(v)=>changeDetail(item.key,'model', v)} placeholder="Model" placeholderTextColor={colors.textDim} style={[s.formInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.primary }]} />
                  </View>
                  <View style={s.formRow}>
                    <Text style={[s.formFieldLabel, { color: colors.textDim }]}>Install Year</Text>
                    <TextInput value={details[item.key]?.installYear || ''} onChangeText={(v)=>changeDetail(item.key,'installYear', v)} placeholder="YYYY" placeholderTextColor={colors.textDim} keyboardType="number-pad" style={[s.formInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.primary }]} />
                  </View>
                  <View style={s.formRow}>
                    <Text style={[s.formFieldLabel, { color: colors.textDim }]}>Location</Text>
                    <TextInput value={details[item.key]?.location || ''} onChangeText={(v)=>changeDetail(item.key,'location', v)} placeholder="Location" placeholderTextColor={colors.textDim} style={[s.formInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.primary }]} />
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      <Pressable onPress={onDone} disabled={saving} style={[s.doneBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}>
        <Text style={s.doneText}>{saving ? 'Saving…' : 'Done'}</Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 6 },
  row: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowSelected: {},
  rowText: { fontWeight: '700' },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    borderWidth: 2,
    fontWeight: '800',
  },
  badgeOn: {},
  doneBtn: { marginTop: 16, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '700' },
  formWrap: { borderWidth:2, borderRadius:10, padding:10, marginTop:6, gap:6 },
  formLabel: { fontWeight:'700', marginBottom:4 },
  formRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  formFieldLabel: { fontSize:12, fontWeight:'600' },
  formInput: { paddingHorizontal:10, paddingVertical:6, borderRadius:6, minWidth:120 },
});
