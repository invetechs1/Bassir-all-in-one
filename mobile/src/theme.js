import { useColorScheme } from 'react-native';

// Same palette as the web portal (public/css/style.css).
const light = {
  page: '#f9f9f7',
  surface: '#fcfcfb',
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  textMuted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  border: 'rgba(11,11,11,0.10)',
  series1: '#2a78d6',
  statusGood: '#0ca30c',
  statusCritical: '#d03b3b',
  statusWarning: '#fab219',
  ghost: 'rgba(11,11,11,0.045)'
};

const dark = {
  page: '#0d0d0d',
  surface: '#1a1a19',
  textPrimary: '#ffffff',
  textSecondary: '#c3c2b7',
  textMuted: '#898781',
  gridline: '#2c2c2a',
  baseline: '#383835',
  border: 'rgba(255,255,255,0.10)',
  series1: '#3987e5',
  statusGood: '#0ca30c',
  statusCritical: '#d03b3b',
  statusWarning: '#fab219',
  ghost: 'rgba(255,255,255,0.06)'
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
