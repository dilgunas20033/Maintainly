import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from './BackButton';
import { useApp } from '../lib/appContext';
import { useThemeMode } from '../lib/themeMode';

// MVP: open Google Maps search for a service near user's current home location.
export default function CallService({ navigation }: any) {
  const { profile, homes, currentHomeId } = useApp();
  const home = homes.find(h => h.id === currentHomeId);
  const [query, setQuery] = useState('plumber');
  const { colors } = useThemeMode();

  function openMaps(term: string) {
    const locParts = [home?.city, home?.state].filter(Boolean).join(', ');
    const q = encodeURIComponent(`${term} near ${locParts}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    Linking.openURL(url);
  }

  const suggestions = ['plumber','electrician','hvac repair','roofing','pest control'];

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Find Local Services</Text>
        <View style={{ width:64 }} />
      </View>
      <Text style={[s.caption, { color: colors.textDim }]}>Search for a local provider and open map results.</Text>

      <TextInput value={query} onChangeText={setQuery} style={[s.input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholder="Search (e.g., plumber)" placeholderTextColor={colors.textDim} />
      <Pressable onPress={() => openMaps(query)} style={[s.button, { backgroundColor: colors.primary }]}><Text style={s.btnText}>Search Maps</Text></Pressable>

      <Text style={{ marginTop: 16, fontWeight: '700', color: colors.text }}>Quick picks</Text>
      <FlatList data={suggestions} keyExtractor={t => t} renderItem={({item}) => (
        <Pressable onPress={() => openMaps(item)} style={[s.srow, { borderColor: colors.bgAlt }]}><Text style={{ color: colors.text }}>{item}</Text></Pressable>
      )} />
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex:1, padding:16 },
  title: { fontSize:22, fontWeight:'800', marginBottom:6 },
  caption: { marginBottom:12 },
  input: { height:44, borderWidth:1, borderRadius:10, paddingHorizontal:12 },
  button: { marginTop:8, borderRadius:10, padding:10, alignItems:'center' },
  btnText: { color:'#fff', fontWeight:'700' },
  srow: { padding:12, borderBottomWidth:1 }
});
