import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { getServerUrl, setServerUrl, api } from '../api';
import { useTheme } from '../theme';
import { Card, Button } from '../components';

export default function SettingsScreen({ onSaved, onLogout }) {
  const t = useTheme();
  const [url, setUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getServerUrl().then((u) => setUrl(u || ''));
  }, []);

  async function testAndSave() {
    const clean = url.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(clean)) {
      setTestResult({ ok: false, message: 'The address must start with http:// or https://' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(clean + '/api/systems', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const systems = await res.json();
      if (!Array.isArray(systems)) throw new Error('Unexpected response');
      await setServerUrl(clean);
      setTestResult({ ok: true, message: `Connected — ${systems.length} system(s) found.` });
      if (onSaved) onSaved(clean);
    } catch (e) {
      setTestResult({
        ok: false,
        message: `Could not reach the portal at that address (${e.message}). Make sure the portal server is running and reachable from this phone.`
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api('/api/logout', { method: 'POST' });
    } catch (e) {
      // Proceed to local logout even if server fails
    } finally {
      setLoggingOut(false);
      if (onLogout) onLogout();
    }
  }

  return (
    <ScrollView style={{ backgroundColor: t.page }} contentContainerStyle={{ padding: 14, gap: 14 }}>
      <Card style={{ gap: 12 }}>
        <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: '700' }}>Portal server</Text>
        <Text style={{ color: t.textSecondary, fontSize: 13, lineHeight: 19 }}>
          This app connects to your Bassir All-in-One portal server — the same one the web portal
          uses. Enter its address as reachable from this phone, for example
          https://portal.yourcompany.com or http://192.168.1.10:3000 on your office network.
        </Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.10:3000"
          placeholderTextColor={t.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={{
            borderWidth: 1,
            borderColor: t.baseline,
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            color: t.textPrimary,
            fontSize: 14,
            backgroundColor: t.page
          }}
        />
        <Button title={testing ? 'Testing…' : 'Test & save'} onPress={testAndSave} disabled={testing} />
        {testResult ? (
          <Text
            style={{
              color: testResult.ok ? t.statusGood : t.statusCritical,
              fontSize: 13,
              lineHeight: 19
            }}
          >
            {testResult.message}
          </Text>
        ) : null}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: '700' }}>Account</Text>
        <Button 
          title={loggingOut ? 'Logging out…' : 'Log out'} 
          onPress={handleLogout} 
          disabled={loggingOut} 
          kind="danger" 
        />
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: '700' }}>About</Text>
        <Text style={{ color: t.textSecondary, fontSize: 13, lineHeight: 19 }}>
          Bassir All-in-One — one place to open every Bassir system, see who uses them, and follow
          their business numbers. Sign-in happens on each system itself; this app never stores your
          passwords.
        </Text>
      </Card>
    </ScrollView>
  );
}
