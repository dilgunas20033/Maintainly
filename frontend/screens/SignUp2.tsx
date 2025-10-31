import React, { useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { HeaderShapes, Title, RoundedInput, ButtonOutline, ButtonFilled } from './shared';
import { supabase } from '../lib/supabase';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpStep2({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [fontsLoaded] = useFonts({ /* 'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf'), */ });
  const [country, setCountry] = useState(''); const [stateVal, setStateVal] = useState(''); const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const titleFont = useMemo(() => (fontsLoaded ? 'Geist-Bold' : undefined), [fontsLoaded]);

  async function handleFinish() {
    try {
      setLoading(true);
      // We already have a session from Step 1. Update current user's profile.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in after step 1.');

      const { error: pErr } = await supabase.from('profiles').upsert({
        user_id: user.id, email: user.email,
        country: country || null, state: stateVal || null, city: city || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (pErr) throw pErr;

      Alert.alert('Success', 'Sign up complete! You are logged in.');
      onDone(); // go to temporary success page
    } catch (e:any) { Alert.alert('Save failed', e?.message ?? 'Unknown error'); }
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
              <RoundedInput placeholder="Country" value={country} onChangeText={setCountry} />
              <RoundedInput placeholder="State"   value={stateVal} onChangeText={setStateVal} />
              <RoundedInput placeholder="City"    value={city} onChangeText={setCity} />
              <View style={st.row}><ButtonFilled title={loading ? '...' : 'Sign Up'} onPress={handleFinish} disabled={loading} /></View>
              <View style={st.row}><ButtonOutline title="Back" onPress={onBack} /></View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const st = StyleSheet.create({ container:{paddingHorizontal:24,paddingTop:48,paddingBottom:32,alignItems:'center'}, card:{width:'100%',gap:12, top:75}, row:{alignItems:'center',marginTop:6} });
