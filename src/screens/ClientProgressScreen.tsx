import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setRange } from '../store/slices/prefsSlice';
import { RANGE_OPTIONS } from '../lib/dates';
import PillGroup from '../components/PillGroup';
import WeightPanel from '../components/progress/WeightPanel';
import GirthPanel from '../components/progress/GirthPanel';
import { color, radius, space } from '../theme';
import type { ClientsStackScreenProps } from '../navigation/types';

type SubTab = 'weight' | 'girth';

export default function ClientProgressScreen({
  route,
  navigation,
}: ClientsStackScreenProps<'ClientProgress'>) {
  const { clientId } = route.params;
  const dispatch = useAppDispatch();
  const range = useAppSelector(state => state.prefs.range);
  const [tab, setTab] = useState<SubTab>('weight');

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <View style={styles.subTabs}>
          {(['weight', 'girth'] as const).map(key => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                style={[styles.subTab, active && styles.subTabActive]}
                onPress={() => setTab(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.subTabLabel, active && styles.subTabLabelActive]}>
                  {key === 'weight' ? 'Weight' : 'Girth'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <PillGroup
          options={RANGE_OPTIONS.map(o => ({ key: o.key, label: o.label }))}
          value={range}
          onChange={key => dispatch(setRange(key))}
        />
      </View>

      {tab === 'weight' ? (
        <WeightPanel
          clientId={clientId}
          onAdd={() => navigation.navigate('AddWeight', { clientId })}
        />
      ) : (
        <GirthPanel clientId={clientId} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
  },
  controls: {
    paddingHorizontal: space.l,
    paddingTop: space.s,
    paddingBottom: space.m,
    gap: space.m,
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: color.surfaceSunken,
    borderRadius: radius.m,
    padding: 3,
  },
  subTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.m - 3,
    alignItems: 'center',
  },
  subTabActive: {
    backgroundColor: color.surface,
  },
  subTabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: color.inkMuted,
  },
  subTabLabelActive: {
    color: color.ink,
  },
});
