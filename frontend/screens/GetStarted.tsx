import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Tile, FAB, BottomButton } from './ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App'; // or ../types/navigation if you split types

type P = NativeStackScreenProps<RootStackParamList, 'GetStarted'>;

export default function GetStarted({ navigation }: P) {
  return (
    <View style={s.wrap}>
      {/* ✅ Close ScrollView properly */}
      <ScrollView contentContainerStyle={{ padding: 16 , top:40}}>
        <Text style={s.title}>Get started</Text>

        <View style={s.grid}>
          <Tile title="Add a home" large onPress={() => navigation.navigate('AddHome')} />

          <View style={{ flexDirection: 'row' }}>
            <Tile
              title="Add Appliance"
              onPress={() => navigation.navigate('Placeholder', { title: 'Add Appliance (shortcut)' })}
            />
            <Tile
              title="Call Service"
              onPress={() => navigation.navigate('Placeholder', { title: 'Call Service' })}
            />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Tile
              title="Settings"
              onPress={() => navigation.navigate('Placeholder', { title: 'Settings' })}
            />
            <Tile title="Help" onPress={() => navigation.navigate('Placeholder', { title: 'Help' })} />
          </View>
        </View>
      </ScrollView> {/* ✅ This line was missing */}

      <FAB onPress={() => navigation.navigate('AddHome')} />
      <BottomButton
        title="AI Chatbot"
        onPress={() => navigation.navigate('ChatBot')}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', margin: 16 },
  grid: { paddingBottom: 100 },
});
