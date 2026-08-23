import React, { useEffect } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchClients } from '../store/slices/clientsSlice';
import { Client, ClientGoal } from '../api/types';
import { startedAgoLabel } from '../lib/dates';
import Avatar from '../components/Avatar';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';
import { color, radius, space, type } from '../theme';
import type { ClientsStackScreenProps } from '../navigation/types';

const GOAL_LABELS: Record<ClientGoal, string> = {
  fat_loss: 'Fat loss',
  muscle_gain: 'Muscle gain',
  maintenance: 'Maintenance',
  recomp: 'Recomp',
};

export default function ClientsScreen({
  navigation,
}: ClientsStackScreenProps<'ClientsList'>) {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector(state => state.clients);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  if (status === 'loading' || status === 'idle') {
    return <LoadingView label="Loading clients…" />;
  }

  if (status === 'failed') {
    return <ErrorView failure={error} onRetry={() => dispatch(fetchClients())} />;
  }

  const renderItem = ({ item }: { item: Client }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        navigation.navigate('ClientProgress', {
          clientId: item.id,
          clientName: item.name,
        })
      }
      accessibilityRole="button"
    >
      <Avatar name={item.name} tint={item.avatarColor} />
      <View style={styles.cardText}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {GOAL_LABELS[item.goal]} · {startedAgoLabel(item.startDateISO)}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={status === 'refreshing'}
          onRefresh={() => dispatch(fetchClients({ refresh: true }))}
          tintColor={color.accent}
          colors={[color.accent]}
        />
      }
      ListEmptyComponent={
        <EmptyView title="No clients yet" body="Clients you coach will appear here." />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: space.l,
    gap: space.m,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    backgroundColor: color.surface,
    borderRadius: radius.m,
    padding: space.l,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  meta: {
    ...type.caption,
  },
  chevron: {
    fontSize: 24,
    color: color.inkFaint,
    fontWeight: '400',
  },
});
