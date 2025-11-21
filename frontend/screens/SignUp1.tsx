import React, { useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ fix deprecation warning
import { HeaderShapes, Title, RoundedInput, ButtonOutline, ButtonFilled } from './shared';
import { supabase } from '../lib/supabase';
import { useFonts } from 'expo-font';
import { useApp } from '../lib/appContext';

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
  const { refresh } = useApp();

  const titleFont = useMemo(() => (fontsLoaded ? 'Geist-Bold' : undefined), [fontsLoaded]);

  function isValidEmail(e: string) {
    return /.+@.+\..+/.test(e);
  }

  async function handleNext() {
    try {
      setLoading(true);
      const emailTrim = email.trim();

      if (!isValidEmail(emailTrim)) {
        Alert.alert('Check email', 'Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 8) {
        Alert.alert('Weak password', 'Password must be at least 8 characters.');
        return;
      }

      // Try to sign up
      const { data, error } = await supabase.auth.signUp({ email: emailTrim, password });

      if (error) {
        // If user already exists, sign in with provided password and continue the wizard
        const msg = String(error.message).toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already') || msg.includes('exists')) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email: emailTrim, password });
          if (signInErr) {
            Alert.alert('Account exists', 'This email is already registered, but the password is incorrect. Try Sign In or reset your password.');
            throw signInErr;
          }

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

          await refresh();
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
        await refresh();
      }

      if (!data.session && data.user) {
        // Email confirmation required
        Alert.alert(
          'Confirm your email',
          'We sent you a confirmation link. Please confirm your email, then continue.',
          [
            {
              text: 'Resend',
              onPress: async () => {
                try { await supabase.auth.resend({ type: 'signup', email: emailTrim }); Alert.alert('Sent', 'Confirmation email resent.'); } catch {}
              },
            },
            { text: 'OK' },
          ]
        );
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
