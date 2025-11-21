import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode } from '../lib/themeMode';

export default function SuccessScreen() {
  const { colors } = useThemeMode();
  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 8, color: colors.text }}>✅ Success</Text>
      <Text style={{ color: colors.textDim, marginBottom: 16, textAlign: 'center' }}>
        You’re signed in. This is a temporary screen.
      </Text>
      <Pressable onPress={() => supabase.auth.signOut()} style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Sign out</Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}
