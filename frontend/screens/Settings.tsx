import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import BackButton from './BackButton';
import { supabase } from '../lib/supabase';
import { useApp } from '../lib/appContext';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Settings({ navigation }: any) {
  const { profile } = useApp();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    setFirstName(profile?.first_name || '');
    setCity(profile?.city || '');
    setState(profile?.state || '');
  }, [profile]);

  async function save() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').upsert({
        user_id: user.id,
        first_name: firstName || null,
        city: city || null,
        state: state || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['homes'] });
      Alert.alert('Saved');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Unknown');
    } finally {
      setSaving(false);
    }
  }

  const { mode, toggle, colors } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width:64 }} />
      </View>

      <Text style={[s.section, { color: colors.text }]}>Profile</Text>
      <TextInput placeholder="First name" value={firstName} onChangeText={setFirstName} style={[s.input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholderTextColor={colors.textDim} />
      <TextInput placeholder="City" value={city} onChangeText={setCity} style={[s.input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholderTextColor={colors.textDim} />
      <TextInput placeholder="State" value={state} onChangeText={setState} style={[s.input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholderTextColor={colors.textDim} />
      <Pressable onPress={save} style={[s.btn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]} disabled={saving}><Text style={s.btnText}>{saving ? 'Saving…' : 'Save'}</Text></Pressable>

      <Text style={[s.section, { color: colors.text }]}>Manage</Text>
      <Pressable onPress={() => navigation.navigate('HomesManager')} style={[s.linkBtn, { borderColor: colors.primary, backgroundColor: colors.bgAlt }]}><Text style={[s.linkText, { color: colors.text }]}>Homes</Text></Pressable>
      <Pressable onPress={() => navigation.navigate('AppliancesList', { homeId: (profile as any)?.last_home_id })} style={[s.linkBtn, { borderColor: colors.primary, backgroundColor: colors.bgAlt }]}><Text style={[s.linkText, { color: colors.text }]}>Appliances</Text></Pressable>
      <Pressable onPress={() => navigation.navigate('Calendar', { homeId: (profile as any)?.last_home_id })} style={[s.linkBtn, { borderColor: colors.primary, backgroundColor: colors.bgAlt }]}><Text style={[s.linkText, { color: colors.text }]}>Calendar</Text></Pressable>

      <Text style={[s.section, { color: colors.text }]}>Help</Text>
      <Text style={[s.help, { color: colors.textDim }]}>Need assistance? Email support at support@maintainly.app. We’ll add FAQs and guides here.</Text>

      <Text style={[s.section, { color: colors.text }]}>Appearance</Text>
      <Pressable onPress={toggle} style={[s.linkBtn, { borderColor: colors.primary }]}>
        <Text style={[s.linkText, { color: colors.primary }]}>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Text>
      </Pressable>

      <Pressable onPress={() => supabase.auth.signOut().then(() => navigation.reset({ index:0, routes:[{ name:'GetStarted' as any }] }))} style={[s.btn, { backgroundColor:'#e74c3c' }]}>
        <Text style={s.btnText}>Log Out</Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex:1, padding:16 },
  title: { fontSize:24, fontWeight:'800', marginBottom:8, textAlign:'center' },
  section: { marginTop:16, marginBottom:8, fontWeight:'800', color:'#062029' },
  input: { height:44, borderWidth:1, borderColor:'#00B1F2', borderRadius:10, paddingHorizontal:12, marginBottom:8 },
  btn: { backgroundColor:'#00B1F2', padding:12, borderRadius:10, alignItems:'center' },
  btnText: { color:'#fff', fontWeight:'700' },
  linkBtn: { borderWidth:2, borderColor:'#00B1F2', borderRadius:10, padding:12, marginBottom:8 },
  linkText: { fontWeight:'800' },
  help: { color:'#456', marginBottom:12 },
});
