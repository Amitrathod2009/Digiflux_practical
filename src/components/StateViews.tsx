import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiFailure } from '../api/types';
import { color, radius, space, type } from '../theme';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={color.accent} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorView({
  failure,
  onRetry,
}: {
  failure: ApiFailure | null;
  onRetry: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Couldn't load this</Text>
      <Text style={styles.errorBody}>
        {failure?.message ?? 'Something went wrong. Please try again.'}
      </Text>
      <Pressable style={styles.retry} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.retryLabel}>Retry</Text>
      </Pressable>
    </View>
  );
}

export function EmptyView({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyDot} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.muted}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.m,
    padding: space.xl,
  },
  muted: {
    ...type.caption,
    textAlign: 'center',
  },
  errorTitle: {
    ...type.bodyStrong,
    color: color.danger,
  },
  errorBody: {
    ...type.caption,
    textAlign: 'center',
    maxWidth: 280,
  },
  retry: {
    marginTop: space.xs,
    backgroundColor: color.ink,
    borderRadius: radius.m,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryLabel: {
    color: color.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.inkFaint,
  },
  emptyTitle: {
    ...type.bodyStrong,
    color: color.inkMuted,
  },
});
