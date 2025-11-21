import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Tile } from './ui';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useMaintenancePlan, useAppliances } from '../lib/hooks';
import { ensureNotificationSetup, scheduleTaskNotifications } from '../lib/notifications';
import type { MaintenanceTask } from '../types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

type P = NativeStackScreenProps<RootStackParamList, 'HomeDashboard'>;

export default function HomeDashboard({ route, navigation }: P) {
  const { homeId } = route.params;
  const [nickname, setNickname] = useState<string>('Nickname');
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const planQuery = useMaintenancePlan(homeId);
  const appliancesQuery = useAppliances(homeId);
  const qc = useQueryClient();
  const { colors } = useThemeMode();

  useFocusEffect(
    React.useCallback(() => {
      supabase.from('homes').select('nickname').eq('id', homeId).maybeSingle()
        .then(({ data }) => setNickname(data?.nickname || 'Nickname'));
      qc.invalidateQueries({ queryKey: ['maintenance-plan', homeId] });
      return () => {};
    }, [homeId])
  );

  // Curate tasks & schedule notifications when plan loads
  useEffect(() => {
    if (planQuery.data) {
      const curated = planQuery.data.tasks.filter(t => t.severity !== 'info').slice(0, 5);
      setTasks(curated);
      (async () => {
        try {
          await ensureNotificationSetup();
          await scheduleTaskNotifications(curated);
        } catch (e) {
          console.warn('Notification scheduling failed', e);
        }
      })();
    }
  }, [planQuery.data]);

  function renderApplianceNeeds() {
    const ap = appliancesQuery.data || [];
    const tasks = planQuery.data?.tasks || [];
    if (!ap.length) return <Text style={[s.empty, { color: colors.textDim }]}>No appliances yet.</Text>;

    const scored = ap.map(a => {
      const tFor = tasks.filter(t => t.appliance_id === a.id);
      let score = 9999; // higher = less urgent
      let label = 'No issues';
      if (tFor.length) {
        // prioritize overdue, then soonest due date
        const overdue = tFor.filter(t => t.severity === 'overdue');
        if (overdue.length) {
          score = -100;
          label = `Overdue: ${overdue[0].title}`;
        } else {
          const soonest = tFor.reduce((min, t) => Math.min(min, daysUntil(t.due_date)), 9999);
          score = soonest;
          const next = tFor.sort((a,b) => a.due_date.localeCompare(b.due_date))[0];
          label = next ? `Next: ${next.title} • ${next.due_date}` : 'No scheduled tasks';
        }
      }
      return { a, score, label };
    }).sort((x,y) => x.score - y.score);

    return (
      <View>
        {scored.slice(0, 6).map(({ a, label }) => (
          <Pressable key={a.id} onPress={() => navigation.navigate('ViewAppliance', { id: a.id })} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.bg }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <View style={{ flex:1, paddingRight:8 }}>
                <Text style={[s.taskTitle, { color: colors.text }]}>{prettyType(a.type)}</Text>
                <Text style={[s.taskMeta, { color: colors.textDim }]}>{a.location || '—'}{a.install_year ? ` • ${a.install_year}` : ''}</Text>
                <Text style={[s.taskMeta, { color: colors.textDim }]}>{label}</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Providers', { category: providerCategoryFor(a.type) })} style={{ borderWidth:2, borderColor: colors.primary, borderRadius:8, paddingHorizontal:10, paddingVertical:6 }}>
                <Text style={{ color: colors.primary, fontWeight:'700' }}>Providers</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
        <Pressable onPress={() => navigation.navigate('AppliancesList', { homeId, nickname })} style={{ marginTop:8, alignSelf:'center', borderWidth:2, borderColor: colors.primary, borderRadius:8, paddingHorizontal:12, paddingVertical:8 }}>
          <Text style={{ color: colors.primary, fontWeight:'700' }}>Manage Appliances</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={{ padding: 16, flex: 1 }}>
        <View style={s.headerBar}>
          <Pressable onPress={() => navigation.navigate('Settings')} style={s.iconBtn}>
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.text} />
          </Pressable>
          <Text style={[s.title, { color: colors.text }]}>{nickname}</Text>
          <Pressable onPress={() => navigation.navigate('ChatBot')} style={s.iconBtn}>
            <MaterialCommunityIcons name="robot-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Calendar', { homeId })} style={[s.box, { marginBottom: 12, backgroundColor: colors.bgAlt }]}>
          <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding: 10 }}>
            {planQuery.isLoading && <Text style={[s.empty, { color: colors.textDim }]}>Loading tasks…</Text>}
            {!planQuery.isLoading && tasks.length === 0 && (
              <Text style={[s.empty, { color: colors.textDim }]}>No urgent tasks. Great job!</Text>
            )}
            {tasks.map(t => (
              <View key={t.id} style={s.taskRow}>
                <Text style={[s.taskTitle, { color: colors.text }]}>{t.title}</Text>
                <Text style={[s.taskMeta, { color: colors.textDim }]}>{t.due_date} • {t.severity === 'overdue' ? 'Overdue' : 'Soon'}</Text>
              </View>
            ))}
          </ScrollView>
        </Pressable>

        {/* Appliances overview sorted by need */}
        <Text style={[s.boxTitle, { color: colors.text }]}>Appliances (most attention first)</Text>
        <View style={[s.box, { backgroundColor: colors.bgAlt, padding: 10, height: undefined }] }>
          {renderApplianceNeeds()}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Tile icon="account-wrench-outline" title="Providers" onPress={() => navigation.navigate('Providers')} />
        </View>
      </View>

      {/* Bottom-right mini action to edit appliances */}
      <Pressable onPress={() => navigation.navigate('AppliancesList', { homeId, nickname })} style={{ position:'absolute', right:18, bottom:18, width:46, height:46, borderRadius:23, backgroundColor: colors.primary, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.25, shadowRadius:10, elevation:5 }}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: 12 },
  iconBtn: { width: 36, height: 36, alignItems:'center', justifyContent:'center', borderRadius: 18 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  box: { height: 220, borderRadius: 10, overflow:'hidden' },
  boxTitle: { fontSize:16, fontWeight:'700', padding:12, paddingBottom:0 },
  caption: { textAlign: 'center' },
  empty: { fontStyle:'italic' },
  taskRow: { marginBottom:8 },
  taskTitle: { fontSize:14, fontWeight:'600' },
  taskMeta: { fontSize:12 },
});

function daysUntil(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - now.getTime()) / (1000*60*60*24));
}

function prettyType(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function providerCategoryFor(type: string): 'Plumbing' | 'HVAC' | 'Electrical' | 'Roofing' | 'Appliance Repair' | undefined {
  const t = type.toLowerCase();
  if (t.includes('ac') || t.includes('hvac') || t.includes('furnace')) return 'HVAC';
  if (t.includes('water_heater') || t.includes('plumb')) return 'Plumbing';
  if (t.includes('elect')) return 'Electrical';
  if (t.includes('roof')) return 'Roofing';
  if (t.includes('dishwasher') || t.includes('fridge') || t.includes('washer') || t.includes('dryer') || t.includes('oven') || t.includes('microwave')) return 'Appliance Repair';
  return undefined;
}

