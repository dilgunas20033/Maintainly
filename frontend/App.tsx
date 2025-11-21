import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Constants from 'expo-constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from './lib/appContext';
import { ThemeProvider, useThemeMode } from './lib/themeMode';

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
  QuickAddAppliances: { homeId: string };
  HomeDashboard: { homeId: string };
  AppliancesList: { homeId: string; nickname?: string };
  HomesManager: undefined;
  Calendar: { homeId: string };
  Providers: { category?: 'Plumbing' | 'HVAC' | 'Electrical' | 'Roofing' | 'Appliance Repair' } | undefined;
  CallService: undefined;
  Settings: undefined;
  ViewAppliance: { id: string };
  Help: undefined;
  Placeholder: { title: string };
  ChatBot: { applianceId?: string } | undefined;
  EditAppliance: { id: string };
  CustomTaskAdd: { homeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const queryClient = new QueryClient();

function InnerApp() {
  const [flow, setFlow] = useState<Flow>('signin');
  const { sessionChecked, session } = useApp();
  const { mode } = useThemeMode();

  if (!sessionChecked) return null;

  if (!session) {
    if (flow === 'signin') return <SignIn goSignUp={() => setFlow('signup1')} onSuccess={() => setFlow('success')} />;
    if (flow === 'signup1') return <SignUpStep1 onBack={() => setFlow('signin')} onNext={() => setFlow('signup2')} />;
    if (flow === 'signup2') return <SignUpStep2 onBack={() => setFlow('signup1')} onDone={() => setFlow('success')} />;
  }

  console.log('EXPO extra.supabase.url =', (Constants.expoConfig?.extra as any)?.supabase?.url);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="HomeGate" component={HomeGate} />
          <Stack.Screen name="GetStarted" component={GetStarted} />
          <Stack.Screen name="AddHome" component={AddHome} />
          <Stack.Screen name="AddAppliances" component={AddAppliances} />
          <Stack.Screen name="QuickAddAppliances" component={require('./screens/QuickAddAppliances').default} />
          <Stack.Screen name="HomeDashboard" component={HomeDashboard} />
          <Stack.Screen name="AppliancesList" component={AppliancesList} />
          <Stack.Screen name="HomesManager" component={require('./screens/HomesManager').default} />
          <Stack.Screen name="Calendar" component={require('./screens/Calendar').default} />
          <Stack.Screen name="Providers" component={require('./screens/Providers').default} />
          <Stack.Screen name="CallService" component={require('./screens/CallService').default} />
          <Stack.Screen name="Settings" component={require('./screens/Settings').default} />
          <Stack.Screen name="ViewAppliance" component={require('./screens/ViewAppliance').default} />
          <Stack.Screen name="EditAppliance" component={require('./screens/EditAppliance').default} />
          <Stack.Screen name="CustomTaskAdd" component={require('./screens/CustomTaskAdd').default} />
          <Stack.Screen name="Help" component={require('./screens/Help').default} />
          <Stack.Screen name="Placeholder" component={Placeholder} />
          <Stack.Screen name="ChatBot" component={ChatBot} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProvider>
          <InnerApp />
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
