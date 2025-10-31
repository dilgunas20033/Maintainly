import React from 'react';
import { View, Text } from 'react-native';
import BackButton from './BackButton';
import { Primary } from './ui';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

export default function Placeholder({ route }: any) {
  const title = route.params?.title || 'Coming soon';
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <BackButton onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('GetStarted'))} />
      <Text style={{ fontSize: 22, fontWeight:'800', marginBottom: 8 }}>{title}</Text>
      <Text style={{ color:'#666' }}>This screen is a temporary placeholder.</Text>
    </View>
  );
}
