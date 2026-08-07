import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { api } from '../api';
import { useTheme } from '../theme';
import { SystemIcon, Card, StatTile, SectionTitle, Chips, BarChart, EmptyNote } from '../components';

const RANGES = [
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 }
];

const ERROR_TEXT = {
  not_configured: 'No metrics endpoint configured yet. Your developer adds one per METRICS_SPEC.md, then sets its Metrics URL in Manage Systems.',
  unreachable: 'The metrics endpoint could not be reached.',
  invalid_format: 'The metrics endpoint responded in an unexpected format.'
};

function errorText(code) {
  if (ERROR_TEXT[code]) return ERROR_TEXT[code];
  if (String(code).startsWith('http_')) {
    const status = String(code).slice(5);
    return status === '401' || status === '403'
      ? `The metrics endpoint rejected the request (HTTP ${status}). Check the API key.`
      : `The metrics endpoint returned HTTP ${status}.`;
  }
  return 'Could not load metrics.';
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function BusinessScreen() {
  const t = useTheme();
  const [days, setDays] = useState(30);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState({ bySystem: {} });
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    try {
      setError(null);
      const [m, h] = await Promise.all([
        api(`/api/metrics${force ? '?refresh=1' : ''}`),
        api(`/api/metrics/history?days=${days}`)
      ]);
      setMetrics(m);
      setHistory(h);
    } catch (e) {
      setError(e.message);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const entries = metrics ? Object.values(metrics) : [];

  return (
    <ScrollView
      style={{ backgroundColor: t.page }}
      contentContainerStyle={{ padding: 14, gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ color: t.textSecondary, fontSize: 13 }}>
        Live numbers pulled from inside each Bassir system. Pull down to refresh.
      </Text>
      <Chips options={RANGES} value={days} onChange={setDays} />

      {error ? <EmptyNote>{error}. Check the server address in Settings.</EmptyNote> : null}
      {!error && metrics && !entries.length ? (
        <EmptyNote>No systems yet — add your Bassir systems in Manage.</EmptyNote>
      ) : null}

      {entries.map((entry) => {
        const points = (history.bySystem[entry.system.id] || []).filter(
          (h) => h.users && h.users.activeToday !== null
        );
        return (
          <Card key={entry.system.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SystemIcon system={entry.system} size={38} />
              <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 }}>
                {entry.system.name}
              </Text>
            </View>

            {!entry.ok ? (
              <Text style={{ color: t.textSecondary, fontSize: 13 }}>{errorText(entry.error)}</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <StatTile label="Total users" value={entry.data.users.total} />
                  <StatTile label="Active today" value={entry.data.users.activeToday} />
                  <StatTile label="Active this week" value={entry.data.users.activeThisWeek} />
                  <StatTile label="Active this month" value={entry.data.users.activeThisMonth} />
                </View>
                {entry.data.kpis.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {entry.data.kpis.map((k) => (
                      <StatTile key={k.key} label={k.label} value={k.value} unit={k.unit} />
                    ))}
                  </View>
                ) : null}
                {points.length > 1 ? (
                  <View>
                    <SectionTitle hint={`last ${days} days — tap a bar for its value`}>
                      Active users per day
                    </SectionTitle>
                    <BarChart
                      data={points.map((h) => ({
                        label: fmtDate(h.date),
                        title: fmtDate(h.date),
                        value: h.users.activeToday
                      }))}
                    />
                  </View>
                ) : (
                  <Text style={{ color: t.textMuted, fontSize: 12.5 }}>
                    History chart appears after a few days of collected data.
                  </Text>
                )}
              </>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}
