import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signOut } from '../store/slices/authSlice';
import Avatar from '../components/Avatar';
import { color, radius, space, type } from '../theme';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const coach = useAppSelector(state => state.auth.coach);

  const onSignOut = () => {
    dispatch(signOut());
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.heading}>Profile</Text>

        {coach ? (
          <View style={styles.card}>
            <Avatar name={coach.name} tint={color.accent} />
            <View style={styles.cardText}>
              <Text style={styles.name}>{coach.name}</Text>
              <Text style={styles.meta}>{coach.email}</Text>
            </View>
          </View>
        ) : null}

        {coach ? (
          <View style={styles.detailCard}>
            <DetailRow label="Gym" value={coach.gymName} />
            <View style={styles.divider} />
            <DetailRow label="Role" value={coach.role} />
            <View style={styles.divider} />
            <DetailRow label="Clients" value={String(coach.clientCount)} />
          </View>
        ) : null}

        <Pressable style={styles.signOut} onPress={onSignOut} accessibilityRole="button">
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    flex: 1,
    padding: space.l,
    gap: space.l,
  },
  heading: {
    ...type.title,
    marginTop: space.s,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    backgroundColor: color.surface,
    borderRadius: radius.m,
    padding: space.l,
  },
  cardText: {
    gap: 2,
  },
  name: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  meta: {
    ...type.caption,
  },
  detailCard: {
    backgroundColor: color.surface,
    borderRadius: radius.m,
    paddingHorizontal: space.l,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  detailLabel: {
    ...type.caption,
  },
  detailValue: {
    ...type.bodyStrong,
    textTransform: 'capitalize',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.line,
  },
  signOut: {
    marginTop: 'auto',
    marginBottom: space.l,
    borderRadius: radius.m,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: color.dangerSoft,
  },
  signOutLabel: {
    color: color.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
