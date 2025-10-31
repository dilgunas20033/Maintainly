import React from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';

export const BLUE = '#00B1F2';

export function Tile({
  title, onPress, large,
}: { title: string; onPress: () => void; large?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, large && styles.tileLarge]}>
      <Text style={styles.tileText}>{title}</Text>
    </Pressable>
  );
}

export function FAB({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.fab}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>＋</Text>
    </Pressable>
  );
}

export function BottomButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.bottomBtn}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#7aa7b6"
      style={[styles.input, props.style]}
    />
  );
}

export function Primary({ title, onPress, disabled }: any) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.9 }, disabled && { opacity: 0.6 }]}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function Secondary({ title, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.85 }]}>
      <Text style={{ color: BLUE, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 110,
    flex: 1,
    margin: 8,
    justifyContent: 'flex-end',
    padding: 12,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  tileLarge: { height: 210 },
  tileText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  fab: {
    position: 'absolute', right: 18, top: 55,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  bottomBtn: {
    position: 'absolute', bottom: 18, left: 18, right: 18,
    backgroundColor: BLUE, borderRadius: 18, alignItems: 'center', paddingVertical: 12,
  },
  input: {
    height: 44, borderRadius: 10, borderWidth: 1, borderColor: BLUE,
    backgroundColor: '#fff', paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2
  },
  primary: {
    height: 44, borderRadius: 10, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16
  },
  secondary: {
    height: 44, borderRadius: 10, borderWidth: 1, borderColor: BLUE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16
  }
});
