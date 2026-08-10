import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { getServerUrl, setServerUrl, api } from '../api';
import { useTheme } from '../theme';
import { Card, Button } from '../components';

export default function LoginScreen({ onLogin }) {
  const t = useTheme();
  const [url, setUrl] = useState('https://bassirfarm.bassir.net/');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getServerUrl().then((u) => {
      if (u) setUrl(u);
    });
  }, []);

  async function handleLogin() {
    const clean = url.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(clean)) {
      setError('The server URL must start with http:// or https://');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setServerUrl(clean);
      const res = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        if (onLogin) onLogin();
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: t.page }} contentContainerStyle={{ padding: 14, gap: 14, justifyContent: 'center', flexGrow: 1 }}>
      <Card style={{ gap: 12 }}>
        <Text style={{ color: t.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 10 }}>Login</Text>
        
        <Text style={{ color: t.textPrimary, fontSize: 14, fontWeight: '600' }}>Portal Server</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://bassirfarm.bassir.net/"
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

        <Text style={{ color: t.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 10 }}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={t.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
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

        <Text style={{ color: t.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 10 }}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={t.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
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

        <View style={{ marginTop: 10 }}>
          <Button title={loading ? 'Logging in…' : 'Login'} onPress={handleLogin} disabled={loading} />
        </View>

        {error ? (
          <Text style={{ color: t.statusCritical, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}
