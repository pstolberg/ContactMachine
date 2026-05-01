import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials, getAvatarColor } from '../utils/avatars';

interface Props {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 44 }: Props) {
  const bg = getAvatarColor(name);
  const initials = getInitials(name);
  const fontSize = size * 0.38;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
