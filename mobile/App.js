import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getServerUrl, api } from './src/api';
import { useTheme } from './src/theme';
import DashboardScreen from './src/screens/DashboardScreen';
import BusinessScreen from './src/screens/BusinessScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ManageScreen from './src/screens/ManageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';

const TABS = [
  { key: 'dashboard', label: 'Systems', icon: '🧭', title: 'Your Bassir systems' },
  { key: 'business', label: 'Business', icon: '📈', title: 'Business data' },
  { key: 'analytics', label: 'Analytics', icon: '📊', title: 'Analytics' },
  { key: 'manage', label: 'Manage', icon: '🛠️', title: 'Manage systems' },
  { key: 'settings', label: 'Settings', icon: '⚙️', title: 'Settings' }
];

export default function App() {
  const t = useTheme();
  const [tab, setTab] = useState('dashboard');
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    getServerUrl().then(async (url) => {
      setConfigured(!!url);
      if (!url) {
        setReady(true);
      } else {
        try {
          await api('/api/systems');
          setAuthenticated(true);
        } catch (e) {
          if (e.status === 401) {
            setAuthenticated(false);
          } else {
            setAuthenticated(false);
          }
        }
        setReady(true);
      }
    });
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: t.page }} />;

  if (!authenticated) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: t.page,
          paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0
        }}
      >
        <StatusBar style="auto" />
        <LoginScreen onLogin={() => {
          setConfigured(true);
          setAuthenticated(true);
        }} />
      </SafeAreaView>
    );
  }

  const active = TABS.find((x) => x.key === tab);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: t.page,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0
      }}
    >
      <StatusBar style="auto" />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: t.surface,
          borderBottomWidth: 1,
          borderBottomColor: t.border
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: t.series1,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>B</Text>
        </View>
        <Text style={{ color: t.textPrimary, fontSize: 17, fontWeight: '700' }}>{active.title}</Text>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'dashboard' && <DashboardScreen />}
        {tab === 'business' && <BusinessScreen />}
        {tab === 'analytics' && <AnalyticsScreen />}
        {tab === 'manage' && <ManageScreen />}
        {tab === 'settings' && (
          <SettingsScreen
            onSaved={() => {
              setConfigured(true);
              setTab('dashboard');
            }}
            onLogout={() => {
              setAuthenticated(false);
              setTab('dashboard');
            }}
          />
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: t.surface,
          borderTopWidth: 1,
          borderTopColor: t.border,
          paddingBottom: Platform.OS === 'ios' ? 14 : 6,
          paddingTop: 6
        }}
      >
        {TABS.map((item) => {
          const isActive = item.key === tab;
          const locked = !configured && item.key !== 'settings';
          return (
            <Pressable
              key={item.key}
              onPress={() => !locked && setTab(item.key)}
              style={{ flex: 1, alignItems: 'center', gap: 2, opacity: locked ? 0.35 : 1 }}
            >
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? t.series1 : t.textMuted
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
