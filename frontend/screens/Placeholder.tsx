import React from 'react';
import { View, Text } from 'react-native';
import BackButton from './BackButton';
import { useThemeMode } from '../lib/themeMode';

export default function Placeholder({ navigation, route }: any) {
  const title = route?.params?.title || 'Coming soon';
  const { colors } = useThemeMode();
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: 20, backgroundColor: colors.bg }}>
      <BackButton onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('GetStarted'))} />
      <Text style={{ fontSize: 22, fontWeight:'800', marginBottom: 8, color: colors.text }}>{title}</Text>
      <Text style={{ color: colors.textDim, textAlign:'center' }}>This screen was a placeholder; it has no behavior yet. Navigate elsewhere to continue.</Text>
    </View>
  );
}
