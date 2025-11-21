import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView,
  Platform, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode } from '../lib/themeMode';
import BackButton from './BackButton';
import { supabase } from '../lib/supabase';

const BLUE = '#00B1F2';

type Msg = { id: string; role: 'assistant' | 'user'; content: string };



export default function ChatBot({ navigation, route }: any) {
  const applianceId: string | undefined = route?.params?.applianceId;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);
  const { colors, mode } = useThemeMode();

  // Personalized welcome
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let firstName: string | undefined;
      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', user.id)
          .maybeSingle();
        firstName = prof?.first_name || undefined;
      }
      let intro = firstName
        ? `Hi ${firstName}! I’m here to help with your home and appliances.`
        : `Hi! I’m Maintainly. Ask me about your appliances, expected lifespan, or budgeting.`;
      if (applianceId) {
        const { data: ap } = await supabase
          .from('appliances')
          .select('type, install_year, brand, model, location')
          .eq('id', applianceId)
          .maybeSingle();
        if (ap) {
          intro += `\nContext: ${ap.type.replace(/_/g,' ')}${ap.install_year?` (${ap.install_year})`:''}${ap.brand?` • ${ap.brand}`:''}${ap.model?` • ${ap.model}`:''}${ap.location?` @ ${ap.location}`:''}. Tell me the issue or question.`;
        }
      }
      setMessages([{ id: 'welcome', role: 'assistant', content: intro }]);
    })();
  }, [applianceId]);

  function pushMessage(role: 'assistant' | 'user', content: string) {
    setMessages(prev => [...prev, { id: Date.now() + Math.random() + '', role, content }]);
    // Scroll to end
    requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
  }

  async function send() {
  const text = input.trim();
  if (!text || sending) return;

  pushMessage('user', text);
  setInput('');
  setSending(true);

  try {
    // quick sanity: make sure envs are defined
    console.log('SUPA URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);

    // ✅ Invoke via SDK (adds apikey + bearer token + CORS)
    const { data, error } = await supabase.functions.invoke('chat_plan', {
      body: { message: text, applianceId },
    });

    if (error) throw error;

    const answer: string =
      data?.answer ||
      `Here’s what I found:\n${JSON.stringify(data?.prediction || {}, null, 2)}`;

    pushMessage('assistant', answer);
  } catch (e: any) {
    pushMessage('assistant', `Sorry, I ran into an issue: ${e?.message || 'Unknown error'}.`);
  } finally {
    setSending(false);
  }
}

  const renderMsg = ({ item }: { item: Msg }) => (
    <View style={[st.bubble, item.role === 'user' ? st.user : st.assistant]}>
      <Text style={[st.text, item.role === 'user' ? st.textUser : st.textAssistant]}>{item.content}</Text>
    </View>
  );
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 6, android: 0 })}
      >
        <View style={{ flex: 1 }}>
          <View style={st.headerBar}>
            <BackButton onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('GetStarted'))} />
            <Text style={[st.headerTitle, { color: colors.text }]}>ChatBot</Text>
            <View style={{ width: 64 }} />
          </View>

          {/* Chat window */}
          <View style={[st.window, { borderColor: colors.primary, backgroundColor: mode==='dark'?colors.bgAlt:'#fff' }]}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderMsg}
              contentContainerStyle={{ padding: 12 }}
              onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
              onLayout={() => listRef.current?.scrollToEnd?.({ animated: false })}
            />

            {/* Typing indicator */}
            {sending && (
              <View style={st.typing}>
                <ActivityIndicator color={BLUE} />
                <Text style={{ marginLeft: 8, color: '#666' }}>Maintainly is thinking…</Text>
              </View>
            )}
          </View>

          {/* Input row */}
          <View style={[st.inputRow, { backgroundColor: colors.bg }] }>
            <TextInput
              placeholder="Ask Maintainly"
              value={input}
              onChangeText={setInput}
              style={[st.input,{ borderColor: colors.primary, backgroundColor: colors.bgAlt, color: colors.text }]}
              placeholderTextColor={colors.textDim}
              multiline
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable onPress={send} style={[st.sendBtn, { backgroundColor: colors.primary }] }>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{sending?'…':'Send'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const st = StyleSheet.create({
  headerBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:8, paddingBottom:4 },
  headerLeft: {},
  headerRight: {},
  headerTitle: { fontSize:24, fontWeight:'800', textAlign:'center', paddingVertical:8, flex:1 },
  window: {
    flex: 1,
    marginHorizontal: 16,
    borderWidth: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bubble: {
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '90%',
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF7FF',
    borderTopLeftRadius: 4,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: BLUE,
    borderTopRightRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 20 },
  textAssistant: { color: '#123' },
  textUser: { color: '#fff' },
  typing: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  inputRow: { padding:16, paddingTop:10 },
  input: {
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000',
  },
  sendBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
