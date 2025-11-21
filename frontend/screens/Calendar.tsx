import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from './BackButton';
import { useMaintenancePlan } from '../lib/hooks';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLUE = '#00B1F2';

type P = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

export default function Calendar({ route, navigation }: P) {
  const { homeId } = route.params;
  const plan = useMaintenancePlan(homeId);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const { colors } = useThemeMode();

  const [custom, setCustom] = useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('maintainly.custom.tasks');
        const all = raw ? JSON.parse(raw) : [];
        setCustom(all.filter((t: any) => t.home_id === homeId));
        const doneRaw = await AsyncStorage.getItem(`maintainly.done.${homeId}`);
        setDone(doneRaw ? JSON.parse(doneRaw) : {});
      } catch {}
    })();
  }, [homeId, plan.data]);

  const sections = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const tasks = [...(plan.data?.tasks || []), ...custom];
    for (const t of tasks) {
      const month = new Date(t.due_date + 'T00:00:00').toLocaleString(undefined, { month: 'long', year: 'numeric' });
      (groups[month] ||= []).push(t);
    }
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [plan.data, custom]);

  async function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      AsyncStorage.setItem(`maintainly.done.${homeId}`, JSON.stringify(next)).catch(()=>{});
      return next;
    });
  }

  function addCustom() {
    navigation.navigate('CustomTaskAdd', { homeId });
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Maintenance Calendar</Text>
        <View style={{ width:64 }} />
      </View>
      <Pressable onPress={addCustom} style={[s.addBtn, { backgroundColor: colors.primary }]}><Text style={s.addText}>+ Task</Text></Pressable>

      {plan.isLoading && <Text style={{ textAlign: 'center', color: colors.textDim }}>Loading…</Text>}

      {!plan.isLoading && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[s.section, { color: colors.text }]}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={[s.row, { borderColor: colors.primary }, done[item.id] && { backgroundColor: colors.bgAlt }]}>
              <Pressable onPress={() => toggle(item.id)} style={{ flex: 1 }}>
                <Text style={[s.task, { color: colors.text }]}>{item.title}</Text>
                <Text style={[s.meta, { color: colors.textDim }]}>{item.due_date} • {item.severity ? (item.severity === 'overdue' ? 'Overdue' : 'Upcoming') : 'Custom'}{item.category ? ` • ${item.category}` : ''}</Text>
              </Pressable>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={[s.badge, { borderColor: colors.primary, color: colors.primary }, done[item.id] && { backgroundColor: colors.primary, color: '#fff' }]}>{done[item.id] ? '✓' : '○'}</Text>
                {mapTaskToCategory(item) && (
                  <Pressable onPress={() => navigation.navigate('Providers', { category: mapTaskToCategory(item) })} style={[s.findBtn, { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.primary, fontWeight:'700', fontSize: 11 }}>Find provider</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', marginTop: 60, marginBottom: 12, textAlign: 'center' },
  section: { marginTop: 12, marginBottom: 6, fontWeight: '800' },
  row: { borderWidth: 2, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  task: { fontWeight: '700' },
  meta: { fontSize: 12 },
  badge: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, borderWidth: 2, fontWeight: '800' },
  addBtn: { alignSelf:'flex-end', paddingHorizontal:14, paddingVertical:10, borderRadius:8, marginBottom:8 },
  addText: { color:'#fff', fontWeight:'700' },
  findBtn: { marginTop:6, paddingHorizontal:8, paddingVertical:4, borderRadius:8, borderWidth:2 },
});

function mapTaskToCategory(t: any): 'Plumbing' | 'HVAC' | 'Electrical' | 'Roofing' | 'Appliance Repair' | undefined {
  const title = (t?.title || '').toLowerCase();
  const cat = (t?.category || '').toLowerCase();
  if (title.includes('roof')) return 'Roofing';
  if (title.includes('hvac') || title.includes('ac') || cat === 'filter' || cat === 'service') return 'HVAC';
  if (title.includes('plumb') || cat === 'leak') return 'Plumbing';
  if (title.includes('elect')) return 'Electrical';
  if (title.includes('dishwasher') || title.includes('fridge') || title.includes('washer') || title.includes('dryer') || title.includes('oven') || title.includes('microwave') || title.includes('appliance')) return 'Appliance Repair';
  return undefined;
}
