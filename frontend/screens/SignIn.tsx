import React, { useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert, Pressable, Text } from 'react-native';
import { HeaderShapes, Title, RoundedInput, ButtonOutline, ButtonFilled } from './shared';
import { supabase } from '../lib/supabase';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../lib/appContext';

export default function SignIn({ goSignUp, onSuccess }: { goSignUp: () => void; onSuccess: () => void }) {
  const [fontsLoaded] = useFonts({ /* 'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf'), */ });
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false);
  const titleFont = useMemo(() => (fontsLoaded ? 'Geist-Bold' : undefined), [fontsLoaded]);
  const { refresh } = useApp();

  async function handleSignIn() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials')) {
          throw new Error('Invalid email or password.');
        }
        if (msg.includes('not confirmed')) {
          Alert.alert('Confirm your email', 'Please confirm your email before signing in.', [
            {
              text: 'Resend',
              onPress: async () => { try { await supabase.auth.resend({ type: 'signup', email: email.trim() }); Alert.alert('Sent', 'Confirmation email resent.'); } catch {} },
            },
            { text: 'OK' },
          ]);
          return;
        }
        throw error;
      }
      await refresh();
      onSuccess();
    } catch (e:any) { Alert.alert('Sign in failed', e?.message ?? 'Unknown error'); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <HeaderShapes />
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.select({ ios:'padding', android:undefined })}>
        <View style={{ flex:1 }}>
          <ScrollView contentContainerStyle={st.container} keyboardShouldPersistTaps="handled">
            <Title fontFamily={titleFont}>Maintainly</Title>
            <View style={st.card}>
              <RoundedInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <RoundedInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
              <View style={st.row}><ButtonOutline title={loading ? '...' : 'Sign In'} onPress={handleSignIn} disabled={loading} /></View>
              <View style={st.row}><ButtonFilled title="Sign Up" onPress={goSignUp} /></View>
              <Pressable onPress={() => Alert.alert('Password reset', 'Use the email link in your inbox if password reset is enabled in your project settings.')} style={{ alignSelf:'center', marginTop:8 }}>
                <Text style={{ color:'#00B1F2', fontWeight:'700' }}>Forgot password?</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const st = StyleSheet.create({ container:{paddingHorizontal:24,paddingTop:48,paddingBottom:32,alignItems:'center'}, card:{width:'100%',gap:12,top:120}, row:{alignItems:'center',marginTop:6, } });
