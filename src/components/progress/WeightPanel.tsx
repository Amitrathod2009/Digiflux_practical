import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteWeight, fetchWeight, WeightListItem } from '../../store/slices/weightSlice';
import { setWeightUnit } from '../../store/slices/prefsSlice';
import { formatWeight, WeightUnit } from '../../lib/units';
import { rowDeltas, totalChange } from '../../lib/stats';
import { formatDay, rangeLabel } from '../../lib/dates';
import { EmptyView, ErrorView, LoadingView } from '../StateViews';
import { color, radius, space, type } from '../../theme';

interface WeightPanelProps {
  clientId: string;
  onAdd: () => void;
}

export default function WeightPanel({ clientId, onAdd }: WeightPanelProps) {
  const dispatch = useAppDispatch();
  const range = useAppSelector(state => state.prefs.range);
  const unit = useAppSelector(state => state.prefs.weightUnit);
  const { items, status, error } = useAppSelector(state => state.weight);

  useEffect(() => {
    dispatch(fetchWeight({ clientId, range }));
  }, [dispatch, clientId, range]);

  const deltas = useMemo(() => rowDeltas(items.map(i => i.weightKg)), [items]);
  const change = useMemo(() => totalChange(items.map(i => i.weightKg)), [items]);

  const confirmDelete = (item: WeightListItem) => {
    if (item.pending) {
      return;
    }
    Alert.alert(
      'Delete this entry?',
      `${formatDay(item.dateISO)} · ${formatWeight(item.weightKg, unit)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteWeight({ entryId: item.id }))
              .unwrap()
              .catch(failure => {
                Alert.alert('Delete failed', failure.message);
              });
          },
        },
      ],
    );
  };

  if (status === 'loading' || status === 'idle') {
    return <LoadingView label="Loading weight…" />;
  }
  if (status === 'failed') {
    return (
      <ErrorView failure={error} onRetry={() => dispatch(fetchWeight({ clientId, range }))} />
    );
  }

  const latest = items[0];

  const renderRow = ({ item, index }: { item: WeightListItem; index: number }) => {
    const delta = deltas[index];
    return (
      <Pressable
        style={[styles.row, item.pending && styles.rowPending]}
        onLongPress={() => confirmDelete(item)}
        delayLongPress={400}
        accessibilityHint="Long press to delete"
      >
        <View style={styles.rowText}>
          <Text style={styles.rowDate}>{formatDay(item.dateISO)}</Text>
          {item.note ? (
            <Text style={styles.rowNote} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
        </View>
        {item.pending ? <ActivityIndicator size="small" color={color.inkFaint} /> : null}
        <Text style={styles.rowValue}>{formatWeight(item.weightKg, unit)}</Text>
        <Text style={styles.rowDelta}>
          {delta === null ? '—' : formatWeight(delta, unit, { signed: true, withUnit: false })}
        </Text>
      </Pressable>
    );
  };

  const emptyState =
    range === 'all' ? (
      <EmptyView title="No weight logged yet" body="Add the first entry to start tracking." />
    ) : (
      <EmptyView
        title={`Nothing in the last ${rangeLabel(range)}`}
        body="This client has older entries — switch the range to All to see them."
      />
    );

  return (
    <View style={styles.panel}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          latest ? (
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <Text style={type.overline}>Latest</Text>
                <UnitToggle unit={unit} onChange={u => dispatch(setWeightUnit(u))} />
              </View>
              <Text style={styles.heroValue}>
                {formatWeight(latest.weightKg, unit, { withUnit: false })}
                <Text style={styles.heroUnit}> {unit}</Text>
              </Text>
              <Text style={styles.heroChange}>
                {change === null
                  ? '— no change to show from a single entry'
                  : `${formatWeight(change, unit, { signed: true })} since first entry in range`}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={emptyState}
      />
      <Pressable style={styles.addButton} onPress={onAdd} accessibilityRole="button">
        <Text style={styles.addLabel}>+ Add</Text>
      </Pressable>
    </View>
  );
}

function UnitToggle({
  unit,
  onChange,
}: {
  unit: WeightUnit;
  onChange: (unit: WeightUnit) => void;
}) {
  return (
    <View style={styles.toggle}>
      {(['kg', 'lb'] as const).map(u => {
        const active = u === unit;
        return (
          <Pressable
            key={u}
            style={[styles.toggleOption, active && styles.toggleOptionActive]}
            onPress={() => onChange(u)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{u}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
  },
  list: {
    paddingHorizontal: space.l,
    paddingBottom: 96,
    gap: space.s,
    flexGrow: 1,
  },
  hero: {
    backgroundColor: color.surface,
    borderRadius: radius.m,
    padding: space.xl,
    marginBottom: space.m,
    gap: space.s,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroValue: {
    ...type.hero,
  },
  heroUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: color.inkMuted,
    letterSpacing: 0,
  },
  heroChange: {
    ...type.caption,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: color.surfaceSunken,
    borderRadius: radius.pill,
    padding: 2,
  },
  toggleOption: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  toggleOptionActive: {
    backgroundColor: color.ink,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: color.inkMuted,
  },
  toggleLabelActive: {
    color: color.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    backgroundColor: color.surface,
    borderRadius: radius.s,
    paddingVertical: 14,
    paddingHorizontal: space.l,
  },
  rowPending: {
    opacity: 0.45,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowDate: {
    ...type.body,
  },
  rowNote: {
    ...type.caption,
  },
  rowValue: {
    ...type.bodyStrong,
    ...type.num,
  },
  rowDelta: {
    ...type.caption,
    ...type.num,
    width: 44,
    textAlign: 'right',
  },
  addButton: {
    position: 'absolute',
    left: space.l,
    right: space.l,
    bottom: space.l,
    backgroundColor: color.accent,
    borderRadius: radius.m,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addLabel: {
    color: color.surface,
    fontSize: 16,
    fontWeight: '800',
  },
});
