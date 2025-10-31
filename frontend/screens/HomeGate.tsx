import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type P = NativeStackScreenProps<RootStackParamList, any>;

export default function HomeGate({ navigation }: P) {
  useEffect(() => {
    (async () => {
      // 1) Must be signed in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If you want, navigate to your SignIn here. For now, just show GetStarted.
        navigation.reset({ index: 0, routes: [{ name: 'GetStarted' as any }] });
        return;
      }

      // 2) Try profiles.last_home_id first
      const { data: prof } = await supabase
        .from('profiles')
        .select('last_home_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prof?.last_home_id) {
        navigation.reset({ index: 0, routes: [{ name: 'HomeDashboard', params: { homeId: prof.last_home_id } as any }] });
        return;
      }

      // 3) Otherwise get the latest home for this user
      const { data: home } = await supabase
        .from('homes')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (home?.id) {
        // Also set it as last_home_id for next time
        await supabase.from('profiles').upsert({ user_id: user.id, last_home_id: home.id });
        navigation.reset({ index: 0, routes: [{ name: 'HomeDashboard', params: { homeId: home.id } as any }] });
      } else {
        // No homes yet → Get Started
        navigation.reset({ index: 0, routes: [{ name: 'GetStarted' as any }] });
      }
    })();
  }, [navigation]);

  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#00B1F2" />
    </View>
  );
}
