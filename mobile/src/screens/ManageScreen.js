import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Pressable,
  RefreshControl,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { api } from '../api';
import { useTheme } from '../theme';
import { SystemIcon, Card, Button, EmptyNote } from '../components';

const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

const EMPTY = { name: '', url: '', icon: '', color: '#2a78d6', description: '', metricsUrl: '', metricsKey: '' };

function Field({ label, ...props }) {
  const t = useTheme();
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ color: t.textSecondary, fontSize: 12.5, fontWeight: '600' }}>{label}</Text>
      <TextInput
        placeholderTextColor={t.textMuted}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: t.baseline,
          borderRadius: 8,
          paddingVertical: 9,
          paddingHorizontal: 12,
          color: t.textPrimary,
          fontSize: 14,
          backgroundColor: t.page
        }}
        {...props}
      />
    </View>
  );
}

export default function ManageScreen() {
  const t = useTheme();
  const [systems, setSystems] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null); // null | {id?, ...fields}
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSystems(await api('/api/systems'));
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

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const body = { ...editing };
      delete body.id;
      await api(editing.id ? `/api/systems/${editing.id}` : '/api/systems', {
        method: editing.id ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(system) {
    Alert.alert('Delete system', `Delete "${system.name}"? Its click history will also be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/api/systems/${system.id}`, { method: 'DELETE' });
            load();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Button title="+ Add a system" onPress={() => { setFormError(null); setEditing({ ...EMPTY }); }} />
        {error ? <EmptyNote>{error}. Check the server address in Settings.</EmptyNote> : null}
        {(systems || []).map((s) => (
          <Card key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SystemIcon system={s} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.textPrimary, fontSize: 14.5, fontWeight: '600' }}>{s.name}</Text>
              <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
                {s.url || 'No URL configured'}
              </Text>
            </View>
            <Button
              title="Edit"
              kind="secondary"
              style={{ paddingVertical: 7, paddingHorizontal: 12 }}
              onPress={() => {
                setFormError(null);
                setEditing({
                  id: s.id,
                  name: s.name,
                  url: s.url || '',
                  icon: s.icon || '',
                  color: s.color || '#2a78d6',
                  description: s.description || '',
                  metricsUrl: s.metricsUrl || '',
                  metricsKey: s.metricsKey || ''
                });
              }}
            />
            <Button
              title="Delete"
              kind="danger"
              style={{ paddingVertical: 7, paddingHorizontal: 12 }}
              onPress={() => confirmDelete(s)}
            />
          </Card>
        ))}
      </ScrollView>

      <Modal visible={editing !== null} animationType="slide" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: t.page }}
        >
          {editing !== null && (
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 50, gap: 12 }}>
              <Text style={{ color: t.textPrimary, fontSize: 19, fontWeight: '700' }}>
                {editing.id ? `Edit ${editing.name || 'system'}` : 'Add a system'}
              </Text>
              <Field
                label="Name"
                value={editing.name}
                onChangeText={(v) => setEditing({ ...editing, name: v })}
                placeholder="e.g. Bassir Stock System"
              />
              <Field
                label="URL (system address)"
                value={editing.url}
                onChangeText={(v) => setEditing({ ...editing, url: v })}
                placeholder="https://stock.example.com"
                keyboardType="url"
              />
              <Field
                label="Icon (emoji or image URL)"
                value={editing.icon}
                onChangeText={(v) => setEditing({ ...editing, icon: v })}
                placeholder="📦 or https://…/logo.png"
              />
              <View style={{ gap: 5 }}>
                <Text style={{ color: t.textSecondary, fontSize: 12.5, fontWeight: '600' }}>Tile color</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setEditing({ ...editing, color: c })}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        backgroundColor: c,
                        borderWidth: editing.color === c ? 3 : 0,
                        borderColor: t.textPrimary
                      }}
                    />
                  ))}
                </View>
              </View>
              <Field
                label="Description (optional)"
                value={editing.description}
                onChangeText={(v) => setEditing({ ...editing, description: v })}
                placeholder="Short description shown on the dashboard"
              />
              <Field
                label="Metrics URL (optional — powers Business Data)"
                value={editing.metricsUrl}
                onChangeText={(v) => setEditing({ ...editing, metricsUrl: v })}
                placeholder="https://stock.example.com/api/bassir-metrics"
                keyboardType="url"
              />
              <Field
                label="Metrics API key (optional)"
                value={editing.metricsKey}
                onChangeText={(v) => setEditing({ ...editing, metricsKey: v })}
                placeholder="Sent as Authorization: Bearer …"
              />
              {formError ? (
                <Text style={{ color: t.statusCritical, fontSize: 13 }}>{formError}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <Button
                  title={saving ? 'Saving…' : editing.id ? 'Save changes' : 'Add system'}
                  onPress={save}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
                <Button title="Cancel" kind="secondary" onPress={() => setEditing(null)} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
