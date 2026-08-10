const grid = document.getElementById('grid');

function iconEl(system, cls = 'system-icon') {
  const el = document.createElement('div');
  el.className = cls;
  el.style.background = system.color || '#2a78d6';
  const icon = system.icon || '';
  if (/^https?:\/\//i.test(icon) || icon.startsWith('data:image') || icon.startsWith('/')) {
    const img = document.createElement('img');
    img.src = system.icon;
    img.alt = '';
    el.appendChild(img);
  } else {
    el.textContent = system.icon || '🖥️';
  }
  return el;
}

function relativeTime(ts) {
  if (!ts) return 'Never opened';
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

async function openSystem(system) {
  if (!system.url) {
    alert(`"${system.name}" has no URL yet.\nAdd its address in Manage Systems first.`);
    return;
  }
  // 'noopener' makes window.open() always return null by design, so it can't
  // be used to detect a blocked popup — don't fall back to location.href on
  // it, or every successful open would also navigate this tab away.
  window.open(system.url, '_blank', 'noopener');
  try {
    await fetch(`/api/systems/${system.id}/click`, { method: 'POST' });
  } catch { /* analytics failure must not block access */ }
}

function render(systems, statuses) {
  grid.innerHTML = '';
  if (!systems.length) {
    const note = document.createElement('div');
    note.className = 'empty-note';
    note.textContent = 'No systems yet — add your first Bassir system in Manage Systems.';
    grid.appendChild(note);
    return;
  }
  for (const system of systems) {
    const card = document.createElement('button');
    card.className = 'system-card';
    card.type = 'button';
    card.title = system.url || 'No URL configured yet';
    card.addEventListener('click', () => openSystem(system));

    card.appendChild(iconEl(system));

    const name = document.createElement('div');
    name.className = 'system-name';
    name.textContent = system.name;
    card.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'system-desc';
    desc.textContent = system.description || '';
    card.appendChild(desc);

    const meta = document.createElement('div');
    meta.className = 'system-meta';

    const st = statuses[system.id] || { status: 'unknown' };
    const statusEl = document.createElement('span');
    statusEl.className = `status ${st.status}`;
    const label = { online: 'Online', offline: 'Offline', unconfigured: 'No URL set' }[st.status] || 'Checking…';
    statusEl.innerHTML = '<span class="dot"></span>';
    statusEl.appendChild(document.createTextNode(label));
    meta.appendChild(statusEl);

    const last = document.createElement('span');
    last.textContent = relativeTime(system.lastAccess);
    meta.appendChild(last);

    card.appendChild(meta);
    grid.appendChild(card);
  }
}

async function load() {
  const systems = await (await fetch('/api/systems')).json();
  render(systems, {});
  // Status checks can be slow (they ping each system) — render first, then update.
  try {
    const statuses = await (await fetch('/api/systems/status')).json();
    render(systems, statuses);
  } catch { /* keep the grid without statuses */ }
}

load();
setInterval(load, 90000);
