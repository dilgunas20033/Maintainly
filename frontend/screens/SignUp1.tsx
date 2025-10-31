import React, { useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ fix deprecation warning
import { HeaderShapes, Title, RoundedInput, ButtonOutline, ButtonFilled } from './shared';
import { supabase } from '../lib/supabase';
import { useFonts } from 'expo-font';

type Props = {
  onNext: (data: { email: string }) => void; // go to step 2
  onBack: () => void;
};

export default function SignUpStep1({ onNext, onBack }: Props) {
  const [fontsLoaded] = useFonts({ /* 'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf') */ });
  const [firstName, setFirst]   = useState('');
  const [lastName, setLast]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const titleFont = useMemo(() => (fontsLoaded ? 'Geist-Bold' : undefined), [fontsLoaded]);

  async function handleNext() {
    try {
      setLoading(true);
      const emailTrim = email.trim();

      // Try to sign up
      const { data, error } = await supabase.auth.signUp({ email: emailTrim, password });

      if (error) {
        // If user already exists, sign in with provided password and continue the wizard
        if (String(error.message).toLowerCase().includes('already registered')) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email: emailTrim, password });
          if (signInErr) throw signInErr;

          const { data: u } = await supabase.auth.getUser();
          if (u?.user?.id) {
            await supabase.from('profiles').upsert({
              user_id: u.user.id,
              email: emailTrim,
              first_name: firstName || null,
              last_name: lastName || null,
              updated_at: new Date().toISOString(),
            });
          }

          onNext({ email: emailTrim });
          return;
        }
        throw error;
      }

      // If email confirmations are OFF, we should have a user/session.
      // If they’re ON, user may be null — still proceed to step 2 for onboarding.
      const userId = data.user?.id;
      if (userId) {
        await supabase.from('profiles').upsert({
          user_id: userId,
          email: data.user?.email ?? emailTrim,
          first_name: firstName || null,
          last_name:  lastName  || null,
          updated_at: new Date().toISOString(),
        });
      }

      onNext({ email: emailTrim });
    } catch (e: any) {
      console.log('SIGNUP ERROR RAW:', JSON.stringify(e, null, 2));
      Alert.alert('Sign up failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <HeaderShapes />
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.select({ ios:'padding', android:undefined })}>
        <View style={{ flex:1 }}>
          <ScrollView contentContainerStyle={st.container} keyboardShouldPersistTaps="handled">
            <Title fontFamily={titleFont}>Maintainly</Title>
            <View style={st.card}>
              <RoundedInput placeholder="First Name" value={firstName} onChangeText={setFirst} />
              <RoundedInput placeholder="Last Name"  value={lastName}  onChangeText={setLast} />
              <RoundedInput placeholder="Email"      value={email}     onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <RoundedInput placeholder="Password"   value={password}  onChangeText={setPassword} secureTextEntry />

              <View style={st.row}>
                <ButtonFilled title={loading ? '...' : 'Next'} onPress={handleNext} disabled={loading} />
              </View>
              <View style={st.row}>
                <ButtonOutline title="Back" onPress={onBack} />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container:{ paddingHorizontal:24, paddingTop:48, paddingBottom:32, alignItems:'center' },
  card:{ width:'100%', gap:12, top:75 },
  row:{ alignItems:'center', marginTop:6 },
});
