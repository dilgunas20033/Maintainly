// screens/shared.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';

export const BLUE = '#00B1F2';

export function HeaderShapes() {
  return (
    <>
      <View style={styles.topBlue} />
      <View style={styles.bottomBlue} />
    </>
  );
}

export function Title({ children, fontFamily }: { children: React.ReactNode; fontFamily?: string }) {
  return (
    <Text style={[
      styles.title,
      fontFamily ? { fontFamily } : null,
    ]}>
      {children}
    </Text>
  );
}

export function RoundedInput(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#7aa7b6"
      style={[styles.input, props.style]}
    />
  );
}

export function ButtonFilled({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [
      styles.btnPrimary,
      pressed && { opacity: 0.92 },
      disabled && { opacity: 0.6 },
    ]}>
      <Text style={styles.btnPrimaryText}>{title}</Text>
    </Pressable>
  );
}

export function ButtonOutline({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [
      styles.btnGhost,
      pressed && { opacity: 0.85 },
      disabled && { opacity: 0.6 },
    ]}>
      <Text style={styles.btnGhostText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // title: Geist 64px, -5% letter-spacing, white, shadow y=4
  title: {
    fontSize: 64,
    color: '#fff',
    letterSpacing: -3.2, // ≈ -5% of 64
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 40,
    top: 40,
  },
  input: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    borderColor: BLUE,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 3,
  },
  btnPrimary: {
    height: 40,
    borderRadius: 20,
    backgroundColor: BLUE,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnGhost: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: BLUE,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '600',
  },
  topBlue: {
    position: 'absolute',
    top: -100, left: 0, right: 0,
    height: 360,
    backgroundColor: BLUE,
    transform: [{ skewY: '-10deg' }],
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 }, // y=4
    shadowOpacity: 0.55,
    shadowRadius: 20, // blur ≈ 20
    elevation: 6,
    zIndex: -1,
  },
  bottomBlue: {
    position: 'absolute',
    bottom: -40, left: 0, right: 0,
    height: 220,
    backgroundColor: BLUE,
    transform: [{ skewY: '10deg' }],
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: -4 }, // y=-4
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
    zIndex: -1,
  },
});
