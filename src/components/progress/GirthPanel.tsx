import React, { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchGirth } from '../../store/slices/girthSlice';
import { setSite } from '../../store/slices/prefsSlice';
import { GIRTH_SITES, GirthEntry } from '../../api/types';
import { formatGirth } from '../../lib/units';
import { rowDeltas, totalChange } from '../../lib/stats';
import { formatDay, rangeLabel } from '../../lib/dates';
import PillGroup from '../PillGroup';
import { EmptyView, ErrorView, LoadingView } from '../StateViews';
import { color, radius, space, type } from '../../theme';

const SITE_LABELS = GIRTH_SITES.map(site => ({
  key: site,
  label: site.charAt(0).toUpperCase() + site.slice(1),
}));

export default function GirthPanel({ clientId }: { clientId: string }) {
  const dispatch = useAppDispatch();
  const range = useAppSelector(state => state.prefs.range);
  const site = useAppSelector(state => state.prefs.site);
  const { items, status, error } = useAppSelector(state => state.girth);

  useEffect(() => {
    dispatch(fetchGirth({ clientId, site, range }));
  }, [dispatch, clientId, site, range]);

  const deltas = useMemo(() => rowDeltas(items.map(i => i.valueMm)), [items]);
  const change = useMemo(() => totalChange(items.map(i => i.valueMm)), [items]);

  const sitePills = (
    <View style={styles.sites}>
      <PillGroup
        options={SITE_LABELS}
        value={site}
        onChange={next => dispatch(setSite(next))}
        scrollable
      />
    </View>
  );

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={styles.panel}>
        {sitePills}
        <LoadingView label={`Loading ${site}…`} />
      </View>
    );
  }
  if (status === 'failed') {
    return (
      <View style={styles.panel}>
        {sitePills}
        <ErrorView
          failure={error}
          onRetry={() => dispatch(fetchGirth({ clientId, site, range }))}
        />
      </View>
    );
  }

  const latest = items[0];

  const renderRow = ({ item, index }: { item: GirthEntry; index: number }) => {
    const delta = deltas[index];
    return (
      <View style={styles.row}>
        <Text style={styles.rowDate}>{formatDay(item.dateISO)}</Text>
        <Text style={styles.rowValue}>{formatGirth(item.valueMm)}</Text>
        <Text style={styles.rowDelta}>
          {delta === null ? '—' : formatGirth(delta, { signed: true }).replace(' cm', '')}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.panel}>
      {sitePills}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          latest ? (
            <View style={styles.hero}>
              <Text style={type.overline}>Latest · {site}</Text>
              <Text style={styles.heroValue}>{formatGirth(latest.valueMm)}</Text>
              <Text style={styles.heroChange}>
                {change === null
                  ? '— no change to show from a single entry'
                  : `${formatGirth(change, { signed: true })} since first entry in range`}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          range === 'all' ? (
            <EmptyView
              title={`No ${site} measurements yet`}
              body="Measurements for other sites may still exist — try another site."
            />
          ) : (
            <EmptyView
              title={`Nothing in the last ${rangeLabel(range)}`}
              body={`Older ${site} entries may exist — switch the range to All.`}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
  },
  sites: {
    paddingHorizontal: space.l,
    paddingBottom: space.m,
  },
  list: {
    paddingHorizontal: space.l,
    paddingBottom: space.xl,
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
  heroValue: {
    ...type.hero,
  },
  heroChange: {
    ...type.caption,
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
  rowDate: {
    ...type.body,
    flex: 1,
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
});
