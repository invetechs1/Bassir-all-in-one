const statsEl = document.getElementById('stats');
const dailyChartEl = document.getElementById('daily-chart');
const dailyTableEl = document.getElementById('daily-table');
const systemBarsEl = document.getElementById('system-bars');
const systemTableEl = document.getElementById('system-table');
const tooltip = document.getElementById('tooltip');
const filterRow = document.getElementById('range-filter');

let days = 14;

filterRow.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-days]');
  if (!btn) return;
  days = Number(btn.dataset.days);
  filterRow.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
  load();
});

function showTooltip(evt, title, value) {
  tooltip.innerHTML = '';
  const t = document.createElement('div');
  t.className = 't-title';
  t.textContent = title;
  const v = document.createElement('div');
  v.className = 't-value';
  v.textContent = value;
  tooltip.append(t, v);
  tooltip.style.display = 'block';
  const pad = 14;
  let x = evt.clientX + pad;
  let y = evt.clientY + pad;
  const r = tooltip.getBoundingClientRect();
  if (x + r.width > innerWidth - 8) x = evt.clientX - r.width - pad;
  if (y + r.height > innerHeight - 8) y = evt.clientY - r.height - pad;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

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

// Vertical bar chart of opens per day, rendered as SVG.
function renderDailyChart(perDay) {
  dailyChartEl.innerHTML = '';
  const W = 940;
  const H = 240;
  const M = { top: 14, right: 8, bottom: 26, left: 34 };
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const dataMax = Math.max(1, ...perDay.map((p) => p.count));
  const ticks = Math.min(4, dataMax);
  const tickStep = Math.ceil(dataMax / ticks);
  const max = tickStep * ticks;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Bar chart of system opens per day');

  const css = getComputedStyle(document.documentElement);
  const seriesColor = css.getPropertyValue('--series-1').trim();
  const gridColor = css.getPropertyValue('--gridline').trim();
  const baseColor = css.getPropertyValue('--baseline').trim();
  const mutedColor = css.getPropertyValue('--text-muted').trim();

  // horizontal gridlines + y-axis tick labels
  for (let i = 0; i <= ticks; i++) {
    const value = tickStep * i;
    const y = M.top + ih - (value / max) * ih;
    if (i > 0) {
      const line = document.createElementNS(svg.namespaceURI, 'line');
      line.setAttribute('x1', M.left);
      line.setAttribute('x2', W - M.right);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', gridColor);
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
    const label = document.createElementNS(svg.namespaceURI, 'text');
    label.setAttribute('x', M.left - 8);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('font-size', '11');
    label.setAttribute('fill', mutedColor);
    label.textContent = value;
    svg.appendChild(label);
  }

  // baseline
  const base = document.createElementNS(svg.namespaceURI, 'line');
  base.setAttribute('x1', M.left);
  base.setAttribute('x2', W - M.right);
  base.setAttribute('y1', M.top + ih);
  base.setAttribute('y2', M.top + ih);
  base.setAttribute('stroke', baseColor);
  base.setAttribute('stroke-width', '1');
  svg.appendChild(base);

  const step = iw / perDay.length;
  const barW = Math.min(28, Math.max(6, step * 0.55));
  const labelEvery = Math.ceil(perDay.length / 10);

  perDay.forEach((p, i) => {
    const cx = M.left + step * i + step / 2;
    const h = (p.count / max) * ih;
    const y = M.top + ih - h;

    if (p.count > 0) {
      const bar = document.createElementNS(svg.namespaceURI, 'path');
      const x0 = cx - barW / 2;
      const r = Math.min(4, h);
      // rounded top corners, square base anchored to the baseline
      bar.setAttribute('d',
        `M${x0},${M.top + ih} V${y + r} Q${x0},${y} ${x0 + r},${y} H${x0 + barW - r} ` +
        `Q${x0 + barW},${y} ${x0 + barW},${y + r} V${M.top + ih} Z`);
      bar.setAttribute('fill', seriesColor);
      svg.appendChild(bar);
    }

    // hover hit target covering the full column height
    const hit = document.createElementNS(svg.namespaceURI, 'rect');
    hit.setAttribute('x', M.left + step * i);
    hit.setAttribute('y', M.top);
    hit.setAttribute('width', step);
    hit.setAttribute('height', ih);
    hit.setAttribute('fill', 'transparent');
    hit.addEventListener('mousemove', (evt) =>
      showTooltip(evt, fmtDate(p.date), `${p.count} open${p.count === 1 ? '' : 's'}`));
    hit.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(hit);

    if (i % labelEvery === 0) {
      const label = document.createElementNS(svg.namespaceURI, 'text');
      label.setAttribute('x', cx);
      label.setAttribute('y', H - 8);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', mutedColor);
      label.textContent = fmtDate(p.date);
      svg.appendChild(label);
    }
  });

  dailyChartEl.appendChild(svg);

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
      showTooltip(evt, s.name, `${s.count} open${s.count === 1 ? '' : 's'} in this period`));
    track.addEventListener('mouseleave', hideTooltip);

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
