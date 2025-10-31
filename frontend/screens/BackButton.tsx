import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, Insets } from 'react-native';

export default function BackButton({
  onPress,
  style,
  label = '‹ Back',
  hitSlop = { top: 12, left: 12, right: 12, bottom: 12 },
}: {
  onPress: () => void;
  style?: ViewStyle;
  label?: string;
  hitSlop?: Insets;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, style]} hitSlop={hitSlop}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00B1F2',
    backgroundColor: '#ffffffcc',
    zIndex: 10,                 // <-- make sure it’s above everything
    elevation: 10,              // <-- Android
    top: 55,
  },
  text: { color: '#00B1F2', fontWeight: '700' },
});
