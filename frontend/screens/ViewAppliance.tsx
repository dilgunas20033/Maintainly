import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import BackButton from './BackButton';
import { supabase } from '../lib/supabase';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ViewAppliance({ route, navigation }: any) {
  const id = route.params?.id;
  const [appliance, setAppliance] = useState<any>(null);
  const { colors } = useThemeMode();

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data, error } = await supabase.from('appliances').select('*').eq('id', id).maybeSingle();
      if (error) return Alert.alert('Load failed', error.message);
      setAppliance(data);
    })();
  }, [id]);

  async function remove() {
    try {
      const { error } = await supabase.from('appliances').delete().eq('id', id);
      if (error) throw error;
      Alert.alert('Deleted');
      navigation.goBack();
    } catch (e:any) { Alert.alert('Delete failed', e?.message || 'Unknown'); }
  }

  if (!appliance) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bg }}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={{ color: colors.text }}>Loading…</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>{appliance.type.replace(/_/g,' ')}</Text>
        <View style={{ width:64 }} />
      </View>
      <Text style={[s.meta, { color: colors.textDim }]}>Installed: {appliance.install_year || 'Unknown'}</Text>
      <Text style={[s.meta, { color: colors.textDim }]}>Brand: {appliance.brand || '—'}</Text>
      <Text style={[s.meta, { color: colors.textDim }]}>Model: {appliance.model || '—'}</Text>
      <Text style={[s.meta, { color: colors.textDim }]}>Location: {appliance.location || '—'}</Text>
      <View style={{ marginTop:20 }}>
        <Pressable onPress={remove} style={s.del}><Text style={{ color:'#fff', fontWeight:'700' }}>Delete</Text></Pressable>
      </View>
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex:1, padding:16 },
  title: { fontSize:22, fontWeight:'800', marginBottom:8 },
  meta: { marginBottom:6 },
  del: { backgroundColor:'#d9534f', padding:12, borderRadius:8, alignItems:'center' }
});
