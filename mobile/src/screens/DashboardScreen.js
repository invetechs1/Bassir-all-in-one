import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Linking, Alert, RefreshControl } from 'react-native';
import { api } from '../api';
import { useTheme } from '../theme';
import { SystemIcon, Card, EmptyNote } from '../components';

function relativeTime(ts) {
  if (!ts) return 'Never opened';
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

const STATUS_LABEL = { online: 'Online', offline: 'Offline', unconfigured: 'No URL set' };

export default function DashboardScreen() {
  const t = useTheme();
  const [systems, setSystems] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSystems(await api('/api/systems'));
      // Status pings each system server-side and can be slow — fetch separately.
      api('/api/systems/status').then(setStatuses).catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function openSystem(system) {
    api(`/api/systems/${system.id}/click`, { method: 'POST' }).catch(() => {});
    if (!system.url) {
      Alert.alert(system.name, 'This system has no URL yet. Add its address in Manage Systems.');
      return;
    }
    try {
      await Linking.openURL(system.url);
    } catch {
      Alert.alert('Cannot open', `Could not open ${system.url}`);
    }
  }

  const statusColor = { online: t.statusGood, offline: t.statusCritical, unconfigured: t.statusWarning };

  return (
    <FlatList
      style={{ backgroundColor: t.page }}
      contentContainerStyle={{ padding: 14, gap: 12 }}
      columnWrapperStyle={{ gap: 12 }}
      numColumns={2}
      data={systems || []}
      keyExtractor={(s) => s.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <Text style={{ color: t.textSecondary, fontSize: 13, marginBottom: 6 }}>
          Tap a system to open it and sign in with your username and password.
        </Text>
      }
      ListEmptyComponent={
        systems === null ? null : error ? (
          <EmptyNote>{error}. Check the server address in Settings.</EmptyNote>
        ) : (
          <EmptyNote>No systems yet — add your Bassir systems in Manage.</EmptyNote>
        )
      }
      renderItem={({ item }) => {
        const st = statuses[item.id];
        return (
          <Pressable style={{ flex: 1 }} onPress={() => openSystem(item)}>
            <Card style={{ gap: 10, minHeight: 168 }}>
              <SystemIcon system={item} />
              <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: '650' }}>{item.name}</Text>
              {item.description ? (
                <Text style={{ color: t.textSecondary, fontSize: 12 }} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' }}>
                {st ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: statusColor[st.status] || t.textMuted
                      }}
                    />
                    <Text style={{ color: statusColor[st.status] || t.textMuted, fontSize: 11 }}>
                      {STATUS_LABEL[st.status] || '…'}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}
                <Text style={{ color: t.textMuted, fontSize: 11 }}>{relativeTime(item.lastAccess)}</Text>
              </View>
            </Card>
          </Pressable>
        );
      }}
    />
  );
}
