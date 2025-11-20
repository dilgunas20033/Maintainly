import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Tile, FAB, BottomButton } from './ui';
import { supabase } from '../lib/supabase';
import { useMaintenancePlan } from '../lib/hooks';
import { ensureNotificationSetup, scheduleTaskNotifications } from '../lib/notifications';
import type { MaintenanceTask } from '../types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type P = NativeStackScreenProps<RootStackParamList, 'HomeDashboard'>;

export default function HomeDashboard({ route, navigation }: P) {
  const { homeId } = route.params;
  const [nickname, setNickname] = useState<string>('Nickname');
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const planQuery = useMaintenancePlan(homeId);

  useEffect(() => {
    supabase.from('homes').select('nickname').eq('id', homeId).maybeSingle()
      .then(({ data }) => setNickname(data?.nickname || 'Nickname'));

  }, [homeId]);

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

  return (
    <View style={{ flex:1, backgroundColor:'#fff' }}>
      <View style={{ padding: 16, flex: 1, top:50 }}>
        <Text style={s.title}>{nickname}</Text>

        <View style={[s.box, { marginBottom: 12 }]}>
          <Text style={s.boxTitle}>Upcoming Maintenance</Text>
          <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding: 10 }}>
            {planQuery.isLoading && <Text style={s.empty}>Loading tasks…</Text>}
            {!planQuery.isLoading && tasks.length === 0 && (
              <Text style={s.empty}>No urgent tasks. Great job!</Text>
            )}
            {tasks.map(t => (
              <View key={t.id} style={s.taskRow}>
                <Text style={s.taskTitle}>{t.title}</Text>
                <Text style={s.taskMeta}>{t.due_date} • {t.severity === 'overdue' ? 'Overdue' : 'Soon'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
        <Text style={s.caption}>Calendar (future full view)</Text>

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Tile title="Add/Edit Appliance" onPress={() => navigation.navigate('AppliancesList', { homeId, nickname })} />
          <Tile title="Call Service" onPress={() => navigation.navigate('Placeholder', { title: 'Call Service' })} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Tile title="Scan Receipts" onPress={() => navigation.navigate('Placeholder', { title: 'Scan Receipts' })} />
          <Tile title="Settings" onPress={() => navigation.navigate('Placeholder', { title: 'Settings' })} />
        </View>
      </View>

      <FAB onPress={() => navigation.navigate('AddHome')} />
      <BottomButton
            title="AI Chatbot"
            onPress={() => navigation.navigate('ChatBot')}
        />
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  box: { backgroundColor: '#e5f7ff', height: 220, borderRadius: 10, overflow:'hidden' },
  boxTitle: { fontSize:16, fontWeight:'700', padding:12, paddingBottom:0 },
  caption: { textAlign: 'center', color: '#777' },
  empty: { color:'#456', fontStyle:'italic' },
  taskRow: { marginBottom:8 },
  taskTitle: { fontSize:14, fontWeight:'600', color:'#062029' },
  taskMeta: { fontSize:12, color:'#555' },
});
