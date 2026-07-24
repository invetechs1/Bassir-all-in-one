const form = document.getElementById('system-form');
const listEl = document.getElementById('list');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const errorEl = document.getElementById('form-error');

const fields = {
  name: document.getElementById('f-name'),
  url: document.getElementById('f-url'),
  icon: document.getElementById('f-icon'),
  color: document.getElementById('f-color'),
  description: document.getElementById('f-desc')
};

let editingId = null;

function setEditing(system) {
  editingId = system ? system.id : null;
  formTitle.textContent = system ? `Edit “${system.name}”` : 'Add a system';
  submitBtn.textContent = system ? 'Save changes' : 'Add system';
  cancelBtn.hidden = !system;
  fields.name.value = system ? system.name : '';
  fields.url.value = system ? system.url : '';
  fields.icon.value = system ? system.icon : '';
  fields.color.value = system ? system.color : '#2a78d6';
  fields.description.value = system ? system.description : '';
  errorEl.hidden = true;
  if (system) fields.name.focus();
}

cancelBtn.addEventListener('click', () => setEditing(null));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: fields.name.value,
    url: fields.url.value,
    icon: fields.icon.value,
    color: fields.color.value,
    description: fields.description.value
  };
  const res = await fetch(editingId ? `/api/systems/${editingId}` : '/api/systems', {
    method: editingId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    errorEl.textContent = data.error || 'Something went wrong.';
    errorEl.hidden = false;
    return;
  }
  setEditing(null);
  load();
});

function iconEl(system) {
  const el = document.createElement('div');
  el.className = 'system-icon';
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

function renderList(systems) {
  listEl.innerHTML = '';
  if (!systems.length) {
    listEl.innerHTML = '<p class="page-subtitle">No systems yet.</p>';
    return;
  }
  for (const system of systems) {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.appendChild(iconEl(system));

    const info = document.createElement('div');
    info.className = 'info';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = system.name;
    const url = document.createElement('div');
    url.className = 'url';
    url.textContent = system.url || 'No URL configured';
    info.append(name, url);
    row.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const edit = document.createElement('button');
    edit.className = 'btn secondary';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => {
      setEditing(system);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      if (!confirm(`Delete "${system.name}"? Its click history will also be removed.`)) return;
      await fetch(`/api/systems/${system.id}`, { method: 'DELETE' });
      if (editingId === system.id) setEditing(null);
      load();
    });

    actions.append(edit, del);
    row.appendChild(actions);
    listEl.appendChild(row);
  }
}

async function load() {
  const systems = await (await fetch('/api/systems')).json();
  renderList(systems);
}

load();
