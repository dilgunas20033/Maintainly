import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Primary } from './ui';
import BackButton from './BackButton';
import { supabase } from '../lib/supabase';
import { useAppliances } from '../lib/hooks';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

type P = NativeStackScreenProps<RootStackParamList, 'AppliancesList'>;

export default function AppliancesList({ route, navigation }: P) {
  const { homeId, nickname } = route.params;
  const appliancesQuery = useAppliances(homeId);
  const items = appliancesQuery.data || [];
  const { colors } = useThemeMode();

  function providerCategoryFor(type: string): 'Plumbing' | 'HVAC' | 'Electrical' | 'Roofing' | 'Appliance Repair' | undefined {
    const t = type.toLowerCase();
    if (t.includes('ac') || t.includes('hvac') || t.includes('furnace')) return 'HVAC';
    if (t.includes('water_heater') || t.includes('plumb')) return 'Plumbing';
    if (t.includes('elect')) return 'Electrical';
    if (t.includes('roof')) return 'Roofing';
    if (t.includes('dishwasher') || t.includes('fridge') || t.includes('washer') || t.includes('dryer') || t.includes('oven') || t.includes('microwave')) return 'Appliance Repair';
    return 'Appliance Repair';
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={{ flex:1, padding:16 }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign:'center', color: colors.text }}>
          Appliances{nickname ? ` — ${nickname}` : ''}
        </Text>
        <View style={{ width:64 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={[s.row, { borderColor: colors.primary }]}>
            <View style={{ flex:1 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{pretty(item.type)}</Text>
              <Text style={{ fontSize: 12, color: colors.textDim }}>
                {item.location || '—'} {item.install_year ? `• ${item.install_year}` : ''}
              </Text>
              <View style={{ flexDirection:'row', marginTop:6, gap:8 }}>
                <Pressable style={[s.smallBtn, { borderColor: colors.primary }]} onPress={() => navigation.navigate('ViewAppliance', { id: item.id })}>
                  <Text style={[s.smallBtnText, { color: colors.primary }]}>Details</Text>
                </Pressable>
                    <Pressable style={[s.smallBtn, { borderColor: colors.primary }]} onPress={() => navigation.navigate('ChatBot', { applianceId: item.id })}>
                      <Text style={[s.smallBtnText, { color: colors.primary }]}>Chat</Text>
                    </Pressable>
                    <Pressable style={[s.smallBtn, { borderColor: colors.primary }]} onPress={() => navigation.navigate('Providers', { category: providerCategoryFor(item.type) })}>
                      <Text style={[s.smallBtnText, { color: colors.primary }]}>Providers</Text>
                    </Pressable>
                    <Pressable style={[s.smallBtn, { borderColor: colors.primary }]} onPress={() => navigation.navigate('EditAppliance', { id: item.id })}>
                      <Text style={[s.smallBtnText, { color: colors.primary }]}>Edit</Text>
                    </Pressable>
                    <Pressable style={[s.smallBtn, { borderColor:'#d9534f' }]} onPress={async () => {
                      try {
                        const { error } = await supabase.from('appliances').delete().eq('id', item.id);
                        if (error) throw error;
                        appliancesQuery.refetch();
                      } catch (e:any) {
                        alert(e.message);
                      }
                    }}>
                      <Text style={[s.smallBtnText, { color:'#d9534f' }]}>Delete</Text>
                    </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={appliancesQuery.isLoading ? <Text style={{ color: colors.textDim }}>Loading…</Text> : <Text style={{ color: colors.textDim }}>No appliances yet.</Text>}
      />

      <View style={{ marginTop: 16 }}>
        <Primary title="Add" onPress={() => navigation.navigate('QuickAddAppliances', { homeId })} />
      </View>
    </View>
    </SafeAreaView>
  );
}

function pretty(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

const s = StyleSheet.create({
  row: { borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'flex-start' },
  smallBtn: { borderWidth:1, borderRadius:8, paddingHorizontal:10, paddingVertical:4 },
  smallBtnText: { fontWeight:'700', fontSize:12 }
});
