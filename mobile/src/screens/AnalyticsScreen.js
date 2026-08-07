import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { api } from '../api';
import { useTheme } from '../theme';
import { Card, StatTile, SectionTitle, Chips, BarChart, HBarList, EmptyNote } from '../components';

const RANGES = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 }
];

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AnalyticsScreen() {
  const t = useTheme();
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api(`/api/analytics?days=${days}`));
    } catch (e) {
      setError(e.message);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ScrollView
      style={{ backgroundColor: t.page }}
      contentContainerStyle={{ padding: 14, gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ color: t.textSecondary, fontSize: 13 }}>
        How your Bassir systems are used from the portal and this app.
      </Text>
      <Chips options={RANGES} value={days} onChange={setDays} />

      {error ? <EmptyNote>{error}. Check the server address in Settings.</EmptyNote> : null}

      {data ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <StatTile label="Systems" value={data.totals.systems} />
            <StatTile label="Opens today" value={data.totals.clicksToday} />
            <StatTile label={`Opens (${data.days} days)`} value={data.totals.clicksWindow} />
            <StatTile label="Opens all time" value={data.totals.clicksAllTime} />
          </View>

          <Card>
            <SectionTitle hint={`last ${data.days} days — tap a bar for its value`}>
              Opens per day
            </SectionTitle>
            <BarChart
              data={data.perDay.map((p) => ({
                label: fmtDate(p.date),
                title: fmtDate(p.date),
                value: p.count
              }))}
            />
          </Card>

          <Card>
            <SectionTitle hint={`last ${data.days} days`}>Opens per system</SectionTitle>
            {data.perSystem.length ? (
              <HBarList
                items={data.perSystem.map((s) => ({ label: s.name, value: s.count }))}
              />
            ) : (
              <Text style={{ color: t.textMuted, fontSize: 13 }}>No systems configured yet.</Text>
            )}
          </Card>

          <Card>
            <SectionTitle>Last opened</SectionTitle>
            <View style={{ gap: 8 }}>
              {data.perSystem.map((s) => (
                <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.textPrimary, fontSize: 13.5, flex: 1 }} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                    {s.lastAccess ? new Date(s.lastAccess).toLocaleString() : 'Never'}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}
