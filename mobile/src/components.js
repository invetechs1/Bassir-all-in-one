import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useTheme } from './theme';

const isImageIcon = (icon) =>
  /^https?:\/\//i.test(icon || '') || (icon || '').startsWith('data:image');

export function SystemIcon({ system, size = 52 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: size * 0.25,
    backgroundColor: system.color || '#2a78d6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  };
  if (isImageIcon(system.icon)) {
    return (
      <View style={style}>
        <Image source={{ uri: system.icon }} style={{ width: size, height: size }} />
      </View>
    );
  }
  return (
    <View style={style}>
      <Text style={{ fontSize: size * 0.52 }}>{system.icon || '🖥️'}</Text>
    </View>
  );
}

export function Card({ children, style }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 14,
          padding: 16
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

export function StatTile({ label, value, unit }) {
  const t = useTheme();
  const v = typeof value === 'number' ? value.toLocaleString() : value ?? '—';
  return (
    <Card style={{ flex: 1, minWidth: '45%', padding: 14 }}>
      <Text style={{ color: t.textSecondary, fontSize: 12.5, fontWeight: '500' }}>{label}</Text>
      <Text style={{ color: t.textPrimary, fontSize: 24, fontWeight: '700', marginTop: 4 }}>
        {unit ? `${v} ${unit}` : v}
      </Text>
    </Card>
  );
}

export function SectionTitle({ children, hint }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
      <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: '700' }}>{children}</Text>
      {hint ? <Text style={{ color: t.textMuted, fontSize: 12 }}>{hint}</Text> : null}
    </View>
  );
}

export function Chips({ options, value, onChange }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: active ? t.series1 : t.baseline,
              backgroundColor: active ? t.ghost : 'transparent'
            }}
          >
            <Text
              style={{
                color: active ? t.textPrimary : t.textSecondary,
                fontSize: 13,
                fontWeight: active ? '600' : '400'
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Vertical bar chart built from plain Views. Tapping a bar shows its value.
export function BarChart({ data, height = 150 }) {
  const t = useTheme();
  const [selected, setSelected] = useState(null);
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelEvery = Math.ceil(data.length / 5);
  return (
    <View>
      <View style={{ height: 20 }}>
        {selected !== null && (
          <Text style={{ color: t.textSecondary, fontSize: 12.5, fontWeight: '600' }}>
            {data[selected].title}: {data[selected].value}
          </Text>
        )}
      </View>
      <View
        style={{
          height,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 2,
          borderBottomWidth: 1,
          borderBottomColor: t.baseline
        }}
      >
        {data.map((d, i) => (
          <Pressable
            key={i}
            onPress={() => setSelected(selected === i ? null : i)}
            style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}
          >
            <View
              style={{
                height: Math.max(d.value > 0 ? 3 : 1, (d.value / max) * height),
                backgroundColor: d.value > 0 ? t.series1 : t.gridline,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                opacity: selected === null || selected === i ? 1 : 0.35
              }}
            />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1 }}>
            {i % labelEvery === 0 ? (
              <Text style={{ color: t.textMuted, fontSize: 9.5 }} numberOfLines={1}>
                {d.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

// Horizontal magnitude bars with the value printed at the end of each row.
export function HBarList({ items }) {
  const t = useTheme();
  const max = Math.max(1, ...items.map((s) => s.value));
  return (
    <View style={{ gap: 10 }}>
      {items.map((s, i) => (
        <View key={i}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={{ color: t.textPrimary, fontSize: 13 }} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>{s.value}</Text>
          </View>
          <View style={{ height: 10, borderRadius: 4 }}>
            <View
              style={{
                width: `${Math.max(1, (s.value / max) * 100)}%`,
                height: '100%',
                borderRadius: 4,
                backgroundColor: t.series1,
                opacity: s.value === 0 ? 0.25 : 1
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function Button({ title, onPress, kind = 'primary', disabled, style }) {
  const t = useTheme();
  const colors = {
    primary: { bg: t.series1, fg: '#ffffff', border: 'transparent' },
    secondary: { bg: 'transparent', fg: t.textPrimary, border: t.baseline },
    danger: { bg: 'transparent', fg: t.statusCritical, border: t.statusCritical }
  }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1
        },
        style
      ]}
    >
      <Text style={{ color: colors.fg, fontSize: 14, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export function EmptyNote({ children }) {
  const t = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: t.baseline,
        borderRadius: 14,
        padding: 22
      }}
    >
      <Text style={{ color: t.textSecondary, fontSize: 13.5, textAlign: 'center' }}>{children}</Text>
    </View>
  );
}
