import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { color, radius, space } from '../theme';

interface PillGroupProps<K extends string> {
  options: Array<{ key: K; label: string }>;
  value: K;
  onChange: (key: K) => void;
  scrollable?: boolean;
}

export default function PillGroup<K extends string>({
  options,
  value,
  onChange,
  scrollable = false,
}: PillGroupProps<K>) {
  const pills = options.map(option => {
    const active = option.key === value;
    return (
      <Pressable
        key={option.key}
        onPress={() => onChange(option.key)}
        style={[styles.pill, active && styles.pillActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {pills}
      </ScrollView>
    );
  }
  return <View style={styles.row}>{pills}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.s,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: color.surfaceSunken,
  },
  pillActive: {
    backgroundColor: color.ink,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: color.inkMuted,
  },
  labelActive: {
    color: color.surface,
  },
});
