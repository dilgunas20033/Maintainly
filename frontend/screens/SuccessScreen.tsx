import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SuccessScreen() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 8 }}>✅ Success</Text>
      <Text style={{ color: '#333', marginBottom: 16, textAlign: 'center' }}>
        You’re signed in. This is a temporary screen.
      </Text>
      <Pressable onPress={() => supabase.auth.signOut()} style={{ backgroundColor: '#00B1F2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
