import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tile, FAB, BottomButton } from './ui';
import { supabase } from '../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type P = NativeStackScreenProps<RootStackParamList, 'HomeDashboard'>;

export default function HomeDashboard({ route, navigation }: P) {
  const { homeId } = route.params;
  const [nickname, setNickname] = useState<string>('Nickname');

  useEffect(() => {
    supabase.from('homes').select('nickname').eq('id', homeId).maybeSingle()
      .then(({ data }) => setNickname(data?.nickname || 'Nickname'));
  }, [homeId]);

  return (
    <View style={{ flex:1, backgroundColor:'#fff' }}>
      <View style={{ padding: 16, flex: 1, top:50 }}>
        <Text style={s.title}>{nickname}</Text>

        <View style={[s.box, { marginBottom: 12 }]} />
        <Text style={s.caption}>Calendar</Text>

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
  box: { backgroundColor: '#e5f7ff', height: 180, borderRadius: 10 },
  caption: { textAlign: 'center', color: '#777' },
});
