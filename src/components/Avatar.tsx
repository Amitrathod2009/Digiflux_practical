import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color } from '../theme';

export default function Avatar({ name, tint }: { name: string; tint: string }) {
  return (
    <View style={[styles.ring, { borderColor: tint }]}>
      <View style={[styles.fill, { backgroundColor: `${tint}22` }]}>
        <Text style={[styles.initial, { color: tint }]}>
          {name.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    padding: 2,
    backgroundColor: color.surface,
  },
  fill: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 16,
    fontWeight: '800',
  },
});
