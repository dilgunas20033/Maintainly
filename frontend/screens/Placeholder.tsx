import React from 'react';
import { View, Text } from 'react-native';
import BackButton from './BackButton';
import { useThemeMode } from '../lib/themeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Placeholder({ navigation, route }: any) {
  const title = route?.params?.title || 'Coming soon';
  const { colors } = useThemeMode();
  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: 20 }}>
      <View style={{ position:'absolute', left:16, top:8 }}>
        <BackButton onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('GetStarted'))} />
      </View>
      <Text style={{ fontSize: 22, fontWeight:'800', marginBottom: 8, color: colors.text }}>{title}</Text>
      <Text style={{ color: colors.textDim, textAlign:'center' }}>This screen was a placeholder; it has no behavior yet. Navigate elsewhere to continue.</Text>
    </View>
    </SafeAreaView>
  );
}
