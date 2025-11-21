import React, { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import BackButton from './BackButton';
import { Primary, Secondary } from './ui';
import { useThemeMode } from '../lib/themeMode';

interface RouteParams { id: string }

export default function EditAppliance() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [installYear, setInstallYear] = useState<string>('');
  const [notes, setNotes] = useState('');
  const { colors } = useThemeMode();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('appliances').select('*').eq('id', id).maybeSingle();
      if (error) {
        alert(error.message); return;
      }
      if (active && data) {
        setType(data.type || '');
        setLocation(data.location || '');
        setInstallYear(data.install_year ? String(data.install_year) : '');
        setNotes(data.notes || '');
        setLoading(false);
      }
    })();
    return () => { active = false };
  }, [id]);

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.from('appliances').update({
        type,
        location,
        install_year: installYear ? Number(installYear) : null,
        notes
      }).eq('id', id);
      if (error) throw error;
      navigation.goBack();
    } catch (e:any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SafeAreaView style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: colors.bg }}><Text style={{ color: colors.text }}>Loading…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={{ flex:1, padding:16 }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={{ fontSize:20, fontWeight:'700', marginBottom:8, color: colors.text }}>Edit Appliance</Text>
        <View style={{ width:64 }} />
      </View>
      <View style={{ gap:12 }}>
        <View>
          <Text style={[label, { color: colors.textDim }]}>Type</Text>
          <TextInput value={type} onChangeText={setType} style={[input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholder="e.g. hvac" placeholderTextColor={colors.textDim} />
        </View>
        <View>
          <Text style={[label, { color: colors.textDim }]}>Location</Text>
          <TextInput value={location} onChangeText={setLocation} style={[input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholder="e.g. attic" placeholderTextColor={colors.textDim} />
        </View>
        <View>
          <Text style={[label, { color: colors.textDim }]}>Install Year</Text>
          <TextInput value={installYear} onChangeText={setInstallYear} style={[input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} keyboardType="numeric" placeholder="YYYY" placeholderTextColor={colors.textDim} />
        </View>
        <View>
          <Text style={[label, { color: colors.textDim }]}>Notes</Text>
          <TextInput value={notes} onChangeText={setNotes} style={[input,{ height:90, textAlignVertical:'top', borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} multiline placeholder="Optional details" placeholderTextColor={colors.textDim} />
        </View>
      </View>
      <View style={{ marginTop:24, flexDirection:'row', gap:12 }}>
        <Primary title={saving ? 'Saving…' : 'Save'} onPress={save} />
        <Secondary title="Cancel" onPress={() => navigation.goBack()} />
      </View>
    </View>
    </SafeAreaView>
  );
}

const input = {
  borderWidth: 1,
  borderRadius:8,
  paddingHorizontal:12,
  paddingVertical:10
} as const;

const label = {
  fontSize:12,
  fontWeight:'600',
  marginBottom:4,
} as const;
