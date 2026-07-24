const statsEl = document.getElementById('stats');
const dailyChartEl = document.getElementById('daily-chart');
const dailyTableEl = document.getElementById('daily-table');
const systemBarsEl = document.getElementById('system-bars');
const systemTableEl = document.getElementById('system-table');
const filterRow = document.getElementById('range-filter');

let days = 14;

filterRow.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-days]');
  if (!btn) return;
  days = Number(btn.dataset.days);
  filterRow.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
  load();
});

function statTile(label, value) {
  const el = document.createElement('div');
  el.className = 'stat-tile';
  el.innerHTML = `<div class="label"></div><div class="value"></div>`;
  el.querySelector('.label').textContent = label;
  el.querySelector('.value').textContent = value;
  return el;
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderDailyChart(perDay) {
  Viz.barChart(dailyChartEl, perDay.map((p) => ({
    label: fmtDate(p.date),
    title: fmtDate(p.date),
    value: p.count,
    tooltipValue: `${p.count} open${p.count === 1 ? '' : 's'}`
  })), { ariaLabel: 'Bar chart of system opens per day' });

  dailyTableEl.innerHTML = '<tr><th>Date</th><th style="text-align:right">Opens</th></tr>';
  for (const p of perDay) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td></td><td class="num"></td>';
    tr.children[0].textContent = fmtDate(p.date);
    tr.children[1].textContent = p.count;
    dailyTableEl.appendChild(tr);
  }
}

function renderSystemBars(perSystem) {
  systemBarsEl.innerHTML = '';
  if (!perSystem.length) {
    systemBarsEl.innerHTML = '<p class="page-subtitle">No systems configured yet.</p>';
    return;
  }
  const max = Math.max(1, ...perSystem.map((s) => s.count));
  for (const s of perSystem) {
    const row = document.createElement('div');
    row.className = 'hbar-row';

    const label = document.createElement('div');
    label.className = 'hbar-label';
    const icon = document.createElement('span');
    icon.textContent = /^https?:\/\//i.test(s.icon || '') ? '🔹' : (s.icon || '🖥️');
    label.append(icon, document.createTextNode(s.name));

    const track = document.createElement('div');
    track.className = 'hbar-track';
    const fill = document.createElement('div');
    fill.className = 'hbar-fill';
    fill.style.width = (s.count / max) * 100 + '%';
    if (s.count === 0) fill.style.opacity = '0.25';
    track.appendChild(fill);
    track.addEventListener('mousemove', (evt) =>
      Viz.showTooltip(evt, s.name, `${s.count} open${s.count === 1 ? '' : 's'} in this period`));
    track.addEventListener('mouseleave', Viz.hideTooltip);

    const value = document.createElement('div');
    value.className = 'hbar-value';
    value.textContent = s.count;

    row.append(label, track, value);
    systemBarsEl.appendChild(row);
  }
}

function renderSystemTable(perSystem) {
  systemTableEl.innerHTML =
    '<tr><th>System</th><th style="text-align:right">Opens (period)</th><th>Last opened</th></tr>';
  for (const s of perSystem) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td></td><td class="num"></td><td></td>';
    tr.children[0].textContent = s.name;
    tr.children[1].textContent = s.count;
    tr.children[2].textContent = s.lastAccess
      ? new Date(s.lastAccess).toLocaleString()
      : 'Never';
    systemTableEl.appendChild(tr);
  }
}

async function load() {
  const data = await (await fetch(`/api/analytics?days=${days}`)).json();

  statsEl.innerHTML = '';
  statsEl.append(
    statTile('Systems', data.totals.systems),
    statTile('Opens today', data.totals.clicksToday),
    statTile(`Opens (last ${data.days} days)`, data.totals.clicksWindow),
    statTile('Opens all time', data.totals.clicksAllTime)
  );

  document.getElementById('daily-hint').textContent = `last ${data.days} days`;
  document.getElementById('system-hint').textContent = `last ${data.days} days`;

  renderDailyChart(data.perDay);
  renderSystemBars(data.perSystem);
  renderSystemTable(data.perSystem);
}

load();
