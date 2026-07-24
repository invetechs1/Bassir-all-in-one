const systemsEl = document.getElementById('systems');
const filterRow = document.getElementById('range-filter');
const refreshBtn = document.getElementById('refresh-btn');

let days = 30;

filterRow.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-days]');
  if (!btn) return;
  days = Number(btn.dataset.days);
  filterRow.querySelectorAll('button[data-days]').forEach((b) => b.classList.toggle('active', b === btn));
  load();
});

refreshBtn.addEventListener('click', () => load(true));

function iconEl(system) {
  const el = document.createElement('div');
  el.className = 'system-icon';
  el.style.width = '42px';
  el.style.height = '42px';
  el.style.fontSize = '22px';
  el.style.borderRadius = '10px';
  el.style.background = system.color || '#2a78d6';
  if (/^https?:\/\//i.test(system.icon || '') || (system.icon || '').startsWith('data:image')) {
    const img = document.createElement('img');
    img.src = system.icon;
    img.alt = '';
    el.appendChild(img);
  } else {
    el.textContent = system.icon || '🖥️';
  }
  return el;
}

function statTile(label, value, unit) {
  const el = document.createElement('div');
  el.className = 'stat-tile';
  el.innerHTML = `<div class="label"></div><div class="value"></div>`;
  el.querySelector('.label').textContent = label;
  const v = typeof value === 'number' ? value.toLocaleString() : (value ?? '—');
  el.querySelector('.value').textContent = unit ? `${v} ${unit}` : v;
  return el;
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const ERROR_TEXT = {
  not_configured: 'No metrics endpoint configured for this system yet. Ask your developer to add one (see METRICS_SPEC.md in the repository) and set its Metrics URL in Manage Systems.',
  unreachable: 'The metrics endpoint could not be reached. Check that the system is online and its Metrics URL is correct.',
  invalid_format: 'The metrics endpoint responded, but not in the expected format. See METRICS_SPEC.md for the required JSON structure.'
};

function errorText(code) {
  if (ERROR_TEXT[code]) return ERROR_TEXT[code];
  if (String(code).startsWith('http_')) {
    const status = String(code).slice(5);
    return status === '401' || status === '403'
      ? `The metrics endpoint rejected the request (HTTP ${status}). Check the API key in Manage Systems.`
      : `The metrics endpoint returned HTTP ${status}.`;
  }
  return 'Could not load metrics.';
}

function renderSystem(entry, history) {
  const card = document.createElement('div');
  card.className = 'card chart-card';

  const header = document.createElement('h2');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '12px';
  header.appendChild(iconEl(entry.system));
  header.appendChild(document.createTextNode(entry.system.name));
  card.appendChild(header);

  if (!entry.ok) {
    const p = document.createElement('p');
    p.className = 'page-subtitle';
    p.style.margin = '4px 0 0';
    p.textContent = errorText(entry.error);
    card.appendChild(p);
    return card;
  }

  const { users, kpis } = entry.data;

  const stats = document.createElement('div');
  stats.className = 'stat-row';
  stats.append(
    statTile('Total users', users.total),
    statTile('Active today', users.activeToday),
    statTile('Active this week', users.activeThisWeek),
    statTile('Active this month', users.activeThisMonth)
  );
  card.appendChild(stats);

  if (kpis.length) {
    const kpiRow = document.createElement('div');
    kpiRow.className = 'stat-row';
    for (const k of kpis) kpiRow.appendChild(statTile(k.label, k.value, k.unit));
    card.appendChild(kpiRow);
  }

  const points = (history || []).filter((h) => h.users && h.users.activeToday !== null);
  if (points.length > 1) {
    const chartTitle = document.createElement('h2');
    chartTitle.innerHTML = 'Active users per day <span class="hint"></span>';
    chartTitle.querySelector('.hint').textContent = `last ${days} days`;
    card.appendChild(chartTitle);
    const chart = document.createElement('div');
    Viz.barChart(chart, points.map((h) => ({
      label: fmtDate(h.date),
      title: fmtDate(h.date),
      value: h.users.activeToday,
      tooltipValue: `${h.users.activeToday} active user${h.users.activeToday === 1 ? '' : 's'}`
    })), { ariaLabel: `Active users per day for ${entry.system.name}`, height: 200 });
    card.appendChild(chart);
  } else {
    const p = document.createElement('p');
    p.className = 'page-subtitle';
    p.style.margin = '4px 0 0';
    p.textContent = 'History chart will appear after the portal has collected a few days of data.';
    card.appendChild(p);
  }

  return card;
}

async function load(forceRefresh = false) {
  refreshBtn.disabled = true;
  try {
    const [metrics, history] = await Promise.all([
      (await fetch(`/api/metrics${forceRefresh ? '?refresh=1' : ''}`)).json(),
      (await fetch(`/api/metrics/history?days=${days}`)).json()
    ]);
    systemsEl.innerHTML = '';
    const entries = Object.values(metrics);
    if (!entries.length) {
      systemsEl.innerHTML = '<div class="empty-note">No systems yet — add your Bassir systems in Manage Systems.</div>';
      return;
    }
    for (const entry of entries) {
      systemsEl.appendChild(renderSystem(entry, history.bySystem[entry.system.id]));
    }
  } finally {
    refreshBtn.disabled = false;
  }
}

load();
