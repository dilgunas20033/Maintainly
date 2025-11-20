import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Primary } from './ui';
import BackButton from './BackButton';
import { supabase } from '../lib/supabase';
import { useAppliances } from '../lib/hooks';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type P = NativeStackScreenProps<RootStackParamList, 'AppliancesList'>;

export default function AppliancesList({ route, navigation }: P) {
  const { homeId, nickname } = route.params;
  const appliancesQuery = useAppliances(homeId);
  const items = appliancesQuery.data || [];

  return (
    <View style={{ flex:1, backgroundColor:'#fff', padding:16 }}>
      {/* Overlay back button; no header changes */}
      <BackButton onPress={() => navigation.goBack()} />

      <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 10, top: 40, left: 170 }}>
        Appliances{nickname ? ` — ${nickname}` : ''}
      </Text>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex:1 }}>
              <Text style={{ fontWeight: '700' }}>{pretty(item.type)}</Text>
              <Text style={{ fontSize: 12, color:'#666' }}>
                {item.location || '—'} {item.install_year ? `• ${item.install_year}` : ''}
              </Text>
            </View>
            <Pressable style={s.viewBtn} onPress={() => navigation.navigate('Placeholder', { title: 'View (coming soon)' })}>
              <Text style={{ color:'#00B1F2', fontWeight:'700' }}>View</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={appliancesQuery.isLoading ? <Text style={{ color:'#666' }}>Loading…</Text> : <Text style={{ color:'#666' }}>No appliances yet.</Text>}
      />

      <View style={{ marginTop: 16 }}>
        <Primary title="Add" onPress={() => navigation.navigate('AddAppliances', { homeId })} />
      </View>
    </View>
  );
}

function pretty(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

const s = StyleSheet.create({
  row: { borderWidth: 1, borderColor: '#00B1F2', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', top: 40 },
  viewBtn: { borderWidth: 1, borderColor:'#00B1F2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
});
