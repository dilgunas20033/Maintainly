import React from 'react';
import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from './BackButton';
import { useThemeMode } from '../lib/themeMode';

export default function Help({ navigation }: any) {
  const { colors } = useThemeMode();
  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width:64 }} />
      </View>
      <Text style={[s.p, { color: colors.text }]}>- Add a home first, then add appliances.</Text>
      <Text style={[s.p, { color: colors.text }]}>- Dashboard shows upcoming maintenance when appliances exist.</Text>
      <Text style={[s.p, { color: colors.text }]}>- Use Call Service to find local providers via Google Maps.</Text>
      <Text style={[s.p, { color: colors.text }]}>- Scan Receipts lets you attach photos (persistence coming next).</Text>

      <Text style={[s.p, { marginTop: 12, color: colors.text }]}>Need more help?</Text>
      <Pressable onPress={() => Linking.openURL('mailto:support@maintainly.app')}>
        <Text style={[s.link, { color: colors.primary }]}>Email support@maintainly.app</Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex:1, padding:16 },
  title: { fontSize:22, fontWeight:'800', marginBottom:8 },
  p: { marginBottom:6 },
  link: { fontWeight:'700' }
});
