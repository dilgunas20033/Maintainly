import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from './BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { useThemeMode } from '../lib/themeMode';

type P = NativeStackScreenProps<RootStackParamList, 'CustomTaskAdd'>;

interface CustomTaskInput { title: string; due: string; category: string; notes: string }

const STORAGE_KEY = 'maintainly.custom.tasks';

export default function CustomTaskAdd({ route, navigation }: P) {
  const { homeId } = route.params;
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(''); // YYYY-MM-DD
  const [category, setCategory] = useState('general');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { colors } = useThemeMode();

  async function save() {
    if (!title.trim() || !due.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Validation', 'Title and ISO date (YYYY-MM-DD) required.');
      return;
    }
    setSaving(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: any[] = raw ? JSON.parse(raw) : [];
      existing.push({ id: `local-${Date.now()}`, home_id: homeId, title: title.trim(), due_date: due, category, notes: notes.trim() });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      navigation.goBack();
    } catch (e:any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Add Custom Task</Text>
        <View style={{ width:64 }} />
      </View>
      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={[s.input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholderTextColor={colors.textDim} />
      <TextInput placeholder="Due Date YYYY-MM-DD" value={due} onChangeText={setDue} style={[s.input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholderTextColor={colors.textDim} />
      <TextInput placeholder="Category" value={category} onChangeText={setCategory} style={[s.input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]} placeholderTextColor={colors.textDim} />
      <TextInput placeholder="Notes (optional)" value={notes} onChangeText={setNotes} style={[s.input, { borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text, height:90, textAlignVertical:'top' }]} placeholderTextColor={colors.textDim} multiline />
      <Pressable onPress={save} disabled={saving} style={[s.btn, { backgroundColor: colors.primary }, saving && { opacity:0.6 }]}>
        <Text style={s.btnText}>{saving ? 'Saving…' : 'Save Task'}</Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex:1, padding:16 },
  title: { fontSize:24, fontWeight:'800', marginBottom:8, textAlign:'center' },
  input: { borderWidth:2, borderRadius:10, paddingHorizontal:12, paddingVertical:10, marginBottom:10 },
  btn: { padding:14, borderRadius:10, alignItems:'center', marginTop:4 },
  btnText: { color:'#fff', fontWeight:'700' }
});
