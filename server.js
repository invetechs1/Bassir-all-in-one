const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(__dirname, 'seed', 'systems.json');

const CLICK_RETENTION_DAYS = 365;
const STATUS_CACHE_MS = 60 * 1000;
const STATUS_TIMEOUT_MS = 6000;
const METRICS_CACHE_MS = 5 * 60 * 1000;
const METRICS_TIMEOUT_MS = 8000;
const SNAPSHOT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const SNAPSHOT_RETENTION_DAYS = 400;

// ---------------------------------------------------------------------------
// Storage (single JSON file — no external database needed)
// ---------------------------------------------------------------------------

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    const db = {
      systems: seed.map((s) => ({ id: crypto.randomUUID(), ...s })),
      clicks: []
    };
    saveDb(db);
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

let db = loadDb();
db.snapshots = db.snapshots || [];

function pruneOldClicks() {
  const cutoff = Date.now() - CLICK_RETENTION_DAYS * 86400000;
  const before = db.clicks.length;
  db.clicks = db.clicks.filter((c) => c.ts >= cutoff);
  if (db.clicks.length !== before) saveDb(db);
}
pruneOldClicks();

// ---------------------------------------------------------------------------
// Live status checks (cached per system)
// ---------------------------------------------------------------------------

const statusCache = new Map(); // systemId -> { status, httpStatus, checkedAt, ms }

async function checkSystem(system) {
  const cached = statusCache.get(system.id);
  if (cached && Date.now() - cached.checkedAt < STATUS_CACHE_MS) return cached;

  let result;
  if (!system.url) {
    result = { status: 'unconfigured', httpStatus: null, ms: null };
  } else {
    const started = Date.now();
    try {
      const res = await fetch(system.url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS)
      });
      // Any HTTP response means the server is reachable, even 401/403 login walls.
      result = { status: 'online', httpStatus: res.status, ms: Date.now() - started };
    } catch {
      result = { status: 'offline', httpStatus: null, ms: null };
    }
  }
  result.checkedAt = Date.now();
  statusCache.set(system.id, result);
  return result;
}

// ---------------------------------------------------------------------------
// Business metrics pulled from inside each system (see METRICS_SPEC.md)
// ---------------------------------------------------------------------------

const metricsCache = new Map(); // systemId -> { fetchedAt, ok, data | error }

function normalizeMetrics(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.users !== 'object' || raw.users === null) {
    return null;
  }
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  return {
    generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : null,
    users: {
      total: num(raw.users.total),
      activeToday: num(raw.users.activeToday),
      activeThisWeek: num(raw.users.activeThisWeek),
      activeThisMonth: num(raw.users.activeThisMonth)
    },
    kpis: Array.isArray(raw.kpis)
      ? raw.kpis.slice(0, 24).map((k) => ({
          key: String(k.key || '').slice(0, 60),
          label: String(k.label || k.key || '').slice(0, 80),
          value: typeof k.value === 'number' && isFinite(k.value) ? k.value : String(k.value ?? '').slice(0, 60),
          unit: String(k.unit || '').slice(0, 20)
        }))
      : []
  };
}

async function fetchMetrics(system, { force = false } = {}) {
  if (!system.metricsUrl) {
    return { ok: false, error: 'not_configured', fetchedAt: Date.now() };
  }
  const cached = metricsCache.get(system.id);
  if (!force && cached && Date.now() - cached.fetchedAt < METRICS_CACHE_MS) return cached;

  let result;
  try {
    const headers = { Accept: 'application/json' };
    if (system.metricsKey) headers.Authorization = `Bearer ${system.metricsKey}`;
    const res = await fetch(system.metricsUrl, {
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(METRICS_TIMEOUT_MS)
    });
    if (!res.ok) {
      result = { ok: false, error: `http_${res.status}` };
    } else {
      const data = normalizeMetrics(await res.json());
      result = data ? { ok: true, data } : { ok: false, error: 'invalid_format' };
    }
  } catch {
    result = { ok: false, error: 'unreachable' };
  }
  result.fetchedAt = Date.now();
  metricsCache.set(system.id, result);
  return result;
}

function todayKey() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .slice(0, 10);
}

// One snapshot per system per day powers the history charts. The latest fetch
// of the day wins, so numbers converge to end-of-day values.
async function takeSnapshots() {
  let changed = false;
  const date = todayKey();
  for (const system of db.systems) {
    if (!system.metricsUrl) continue;
    const result = await fetchMetrics(system);
    if (!result.ok) continue;
    const existing = db.snapshots.find((s) => s.systemId === system.id && s.date === date);
    const snap = { systemId: system.id, date, ts: Date.now(), users: result.data.users, kpis: result.data.kpis };
    if (existing) Object.assign(existing, snap);
    else db.snapshots.push(snap);
    changed = true;
  }
  const cutoffDate = new Date(Date.now() - SNAPSHOT_RETENTION_DAYS * 86400000).toISOString().slice(0, 10);
  const before = db.snapshots.length;
  db.snapshots = db.snapshots.filter((s) => s.date >= cutoffDate);
  if (changed || db.snapshots.length !== before) saveDb(db);
}

setTimeout(takeSnapshots, 5000);
setInterval(takeSnapshots, SNAPSHOT_INTERVAL_MS);

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Allow the mobile app (and any other origin) to call the API.
app.use('/api', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function publicSystem(s) {
  const clicks = db.clicks.filter((c) => c.systemId === s.id);
  const lastAccess = clicks.length ? Math.max(...clicks.map((c) => c.ts)) : null;
  return { ...s, totalClicks: clicks.length, lastAccess };
}

app.get('/api/systems', (req, res) => {
  res.json(db.systems.map(publicSystem));
});

app.get('/api/systems/status', async (req, res) => {
  const entries = await Promise.all(
    db.systems.map(async (s) => [s.id, await checkSystem(s)])
  );
  res.json(Object.fromEntries(entries));
});

function validateSystemInput(body) {
  const name = String(body.name || '').trim();
  const url = String(body.url || '').trim();
  if (!name) return { error: 'Name is required.' };
  if (url && !/^https?:\/\//i.test(url)) {
    return { error: 'URL must start with http:// or https://' };
  }
  const metricsUrl = String(body.metricsUrl || '').trim();
  if (metricsUrl && !/^https?:\/\//i.test(metricsUrl)) {
    return { error: 'Metrics URL must start with http:// or https://' };
  }
  return {
    value: {
      name,
      url,
      icon: String(body.icon || '🖥️').trim().slice(0, 300),
      description: String(body.description || '').trim().slice(0, 300),
      color: /^#[0-9a-f]{6}$/i.test(body.color || '') ? body.color : '#2a78d6',
      metricsUrl,
      metricsKey: String(body.metricsKey || '').trim().slice(0, 200)
    }
  };
}

app.post('/api/systems', (req, res) => {
  const { error, value } = validateSystemInput(req.body);
  if (error) return res.status(400).json({ error });
  const system = { id: crypto.randomUUID(), ...value };
  db.systems.push(system);
  saveDb(db);
  res.status(201).json(publicSystem(system));
});

app.put('/api/systems/:id', (req, res) => {
  const system = db.systems.find((s) => s.id === req.params.id);
  if (!system) return res.status(404).json({ error: 'System not found.' });
  const { error, value } = validateSystemInput(req.body);
  if (error) return res.status(400).json({ error });
  Object.assign(system, value);
  statusCache.delete(system.id);
  metricsCache.delete(system.id);
  saveDb(db);
  res.json(publicSystem(system));
});

app.delete('/api/systems/:id', (req, res) => {
  const idx = db.systems.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'System not found.' });
  const [removed] = db.systems.splice(idx, 1);
  db.clicks = db.clicks.filter((c) => c.systemId !== removed.id);
  db.snapshots = db.snapshots.filter((s) => s.systemId !== removed.id);
  statusCache.delete(removed.id);
  metricsCache.delete(removed.id);
  saveDb(db);
  res.json({ ok: true });
});

app.post('/api/systems/:id/click', (req, res) => {
  const system = db.systems.find((s) => s.id === req.params.id);
  if (!system) return res.status(404).json({ error: 'System not found.' });
  db.clicks.push({ systemId: system.id, ts: Date.now() });
  saveDb(db);
  res.json({ ok: true, url: system.url });
});

// Live business metrics for every system (used by the Business Data page).
app.get('/api/metrics', async (req, res) => {
  const force = req.query.refresh === '1';
  const entries = await Promise.all(
    db.systems.map(async (s) => [
      s.id,
      { system: { id: s.id, name: s.name, icon: s.icon, color: s.color }, ...(await fetchMetrics(s, { force })) }
    ])
  );
  res.json(Object.fromEntries(entries));
});

// Daily snapshots for the history charts.
app.get('/api/metrics/history', (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const cutoff = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const bySystem = {};
  for (const snap of db.snapshots) {
    if (snap.date < cutoff) continue;
    (bySystem[snap.systemId] = bySystem[snap.systemId] || []).push({
      date: snap.date,
      users: snap.users
    });
  }
  for (const list of Object.values(bySystem)) list.sort((a, b) => a.date.localeCompare(b.date));
  res.json({ days, bySystem });
});

app.get('/api/analytics', (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);
  const now = new Date();
  const dayKey = (d) => d.toISOString().slice(0, 10);

  const perDay = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    perDay.push({ date: dayKey(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))), count: 0 });
  }
  const perDayIndex = new Map(perDay.map((p, i) => [p.date, i]));

  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)).getTime();
  const perSystem = new Map(db.systems.map((s) => [s.id, 0]));

  for (const click of db.clicks) {
    if (click.ts < windowStart) continue;
    const d = new Date(click.ts);
    const key = dayKey(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
    const idx = perDayIndex.get(key);
    if (idx !== undefined) perDay[idx].count++;
    if (perSystem.has(click.systemId)) {
      perSystem.set(click.systemId, perSystem.get(click.systemId) + 1);
    }
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const clicksToday = db.clicks.filter((c) => c.ts >= todayStart).length;

  res.json({
    days,
    totals: {
      systems: db.systems.length,
      clicksToday,
      clicksWindow: perDay.reduce((sum, p) => sum + p.count, 0),
      clicksAllTime: db.clicks.length
    },
    perDay,
    perSystem: db.systems
      .map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        count: perSystem.get(s.id) || 0,
        lastAccess: publicSystem(s).lastAccess
      }))
      .sort((a, b) => b.count - a.count)
  });
});

app.listen(PORT, () => {
  console.log(`Bassir All-in-One portal running at http://localhost:${PORT}`);
});
