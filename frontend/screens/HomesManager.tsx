import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import BackButton from './BackButton';
import { useApp } from '../lib/appContext';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomesManager({ navigation }: any) {
  const { homes, currentHomeId, setCurrentHome, refresh } = useApp();
  const qc = useQueryClient();
  const { colors } = useThemeMode();

  async function choose(id: string) {
    setCurrentHome(id);
    await qc.invalidateQueries({ queryKey: ['maintenance-plan', id] });
    navigation.replace('HomeDashboard', { homeId: id });
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete Home', 'Deleting the home will also remove its appliances. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHome(id) }
    ]);
  }

  async function deleteHome(id: string) {
    try {
      const { error: aErr } = await supabase.from('appliances').delete().eq('home_id', id);
      if (aErr) throw aErr;
      const { error: hErr } = await supabase.from('homes').delete().eq('id', id);
      if (hErr) throw hErr;
      if (currentHomeId === id) {
        // Clear current selection
        setCurrentHome('');
      }
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Your Homes</Text>
        <View style={{ width:64 }} />
      </View>

      <FlatList
        data={homes}
        keyExtractor={(h) => h.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => choose(item.id)} style={[s.row, { borderColor: colors.primary }, item.id === currentHomeId && { backgroundColor: colors.bgAlt }, { flex: 1 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.nick, { color: colors.text }]}>{item.nickname}</Text>
                <Text style={[s.meta, { color: colors.textDim }]}>{item.city}, {item.state}</Text>
              </View>
              <Text style={[s.pick, { color: colors.primary }]}>{item.id === currentHomeId ? 'Current' : 'Select'}</Text>
            </Pressable>
            <Pressable onPress={() => confirmDelete(item.id)} style={[s.delBtn, { borderColor:'#d9534f' }]}>
              <Text style={s.delText}>Delete</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textDim, textAlign: 'center' }}>No homes yet.</Text>}
      />

      <Pressable onPress={() => navigation.navigate('AddHome')} style={[s.addBtn, { backgroundColor: colors.primary }]}>
        <Text style={s.addText}>Add New Home</Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}

const BLUE = '#00B1F2';

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  row: { borderWidth: 2, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center' },
  rowActive: {},
  nick: { fontWeight: '800' },
  meta: {},
  pick: { fontWeight: '800' },
  addBtn: { marginTop: 12, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '800' },
  delBtn: { marginLeft: 8, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  delText: { color: '#d9534f', fontWeight: '800', fontSize: 12 },
});
