import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Constants from 'expo-constants';

/* ---------- AUTH SCREENS ---------- */
import SignIn from './screens/SignIn';
import SignUpStep1 from './screens/SignUp1';
import SignUpStep2 from './screens/SignUp2';

/* ---------- MAIN APP SCREENS ---------- */
import GetStarted from './screens/GetStarted';
import AddHome from './screens/AddHome';
import AddAppliances from './screens/AddAppliances';
import HomeDashboard from './screens/HomeDashboard';
import AppliancesList from './screens/AppliancesList';
import Placeholder from './screens/Placeholder';
import HomeGate from './screens/HomeGate';
import ChatBot from './screens/ChatBot';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type Flow = 'signin' | 'signup1' | 'signup2' | 'success';

export type RootStackParamList = {
  HomeGate: undefined;
  GetStarted: undefined;
  AddHome: undefined;
  AddAppliances: { homeId: string };
  HomeDashboard: { homeId: string };
  AppliancesList: { homeId: string; nickname?: string };
  Placeholder: { title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [flow, setFlow] = useState<Flow>('signin');
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Track session (but DO NOT auto-switch flows)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setSessionChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!sessionChecked) return null;

  // ---------- AUTH FLOW: stay here until YOU set flow === 'success' ----------
  if (flow === 'signin') {
    return <SignIn goSignUp={() => setFlow('signup1')} onSuccess={() => setFlow('success')} />;
  }
  if (flow === 'signup1') {
    return <SignUpStep1 onBack={() => setFlow('signin')} onNext={() => setFlow('signup2')} />;
  }
  if (flow === 'signup2') {
    return <SignUpStep2 onBack={() => setFlow('signup1')} onDone={() => setFlow('success')} />;
  }

console.log('EXPO extra.supabase.url =', (Constants.expoConfig?.extra as any)?.supabase?.url);

  // ---------- MAIN APP FLOW (flow === 'success') ----------
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="HomeGate" component={HomeGate} />
          <Stack.Screen name="GetStarted" component={GetStarted} />
          <Stack.Screen name="AddHome" component={AddHome} />
          <Stack.Screen name="AddAppliances" component={AddAppliances} />
          <Stack.Screen name="HomeDashboard" component={HomeDashboard} />
          <Stack.Screen name="AppliancesList" component={AppliancesList} />
          <Stack.Screen name="Placeholder" component={Placeholder} />
          <Stack.Screen name="ChatBot" component={ChatBot} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
