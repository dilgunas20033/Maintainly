import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Tile, FAB, BottomButton } from './ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App'; // or ../types/navigation if you split types
import { useApp } from '../lib/appContext';
import { useThemeMode } from '../lib/themeMode';

type P = NativeStackScreenProps<RootStackParamList, 'GetStarted'>;

export default function GetStarted({ navigation }: P) {
  const { currentHomeId } = useApp();
  const { colors } = useThemeMode();
  const goAddAppliance = () => {
    if (currentHomeId) navigation.navigate('AddAppliances', { homeId: currentHomeId });
    else navigation.navigate('AddHome');
  };
  return (
    <View style={[s.wrap, { backgroundColor: colors.bg }]}>
      {/* ✅ Close ScrollView properly */}
      <ScrollView contentContainerStyle={{ padding: 16 , top:40}}>
        <Text style={[s.title, { color: colors.text }]}>Get started</Text>

        <View style={s.grid}>
          <Tile icon="home-plus-outline" title="Add a home" large onPress={() => navigation.navigate('AddHome')} />

          <View style={{ flexDirection: 'row' }}>
            <Tile icon="wrench-outline" title="Add Appliance" onPress={goAddAppliance} />
            <Tile icon="account-wrench-outline" title="Providers" onPress={() => navigation.navigate('Providers')} />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Tile icon="cog-outline" title="Settings" onPress={() => navigation.navigate('Settings')} />
            <Tile icon="home-outline" title="Homes" onPress={() => navigation.navigate('HomesManager')} />
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
  wrap: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', margin: 16 },
  grid: { paddingBottom: 100 },
});
