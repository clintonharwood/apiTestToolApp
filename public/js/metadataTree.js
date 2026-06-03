document.addEventListener('DOMContentLoaded', () => {
  const objectList = document.getElementById('object-list');
  const objectLoading = document.getElementById('object-loading');
  const objectCount = document.getElementById('object-count');
  const objectSearch = document.getElementById('object-search');
  const fieldsPlaceholder = document.getElementById('fields-placeholder');
  const fieldsPanel = document.getElementById('fields-panel');
  const fieldsTitle = document.getElementById('fields-title');
  const fieldsCount = document.getElementById('fields-count');
  const fieldsBody = document.getElementById('fields-body');
  const fieldsError = document.getElementById('fields-error');

  let allObjects = [];
  let activeItem = null;
  const fieldCache = new Map();

  function renderObjectList(objects) {
    objectLoading.classList.add('d-none');
    const existing = objectList.querySelectorAll('.obj-item');
    existing.forEach(el => el.remove());

    if (objects.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'meta-empty';
      empty.textContent = 'No objects match.';
      objectList.appendChild(empty);
      objectCount.textContent = '';
      return;
    }

    const frag = document.createDocumentFragment();
    objects.forEach(obj => {
      const el = document.createElement('button');
      el.className = 'obj-item';
      el.dataset.name = obj.name;
      el.innerHTML = `<span class="obj-item__label">${escHtml(obj.name)}</span>`;
      el.addEventListener('click', () => loadFields(obj.name, obj.label, el));
      frag.appendChild(el);
    });
    objectList.appendChild(frag);
    objectCount.textContent = `${objects.length} object${objects.length !== 1 ? 's' : ''}`;
  }

  async function loadObjects() {
    try {
      const res = await fetch('/api/metadata/objects');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      allObjects = data.objects || [];
      renderObjectList(allObjects);
    } catch (err) {
      objectLoading.classList.add('d-none');
      const errEl = document.createElement('div');
      errEl.className = 'meta-load-error';
      errEl.textContent = 'Failed to load objects. Are you logged in?';
      objectList.appendChild(errEl);
    }
  }

  async function loadFields(name, label, listItem) {
    if (activeItem) {
      activeItem.classList.remove('obj-item--active');
    }
    activeItem = listItem;
    listItem.classList.add('obj-item--active');

    fieldsPlaceholder.classList.add('d-none');
    fieldsError.classList.add('d-none');
    fieldsPanel.classList.add('d-none');

    try {
      let data;
      if (fieldCache.has(name)) {
        data = fieldCache.get(name);
      } else {
        const res = await fetch(`/api/metadata/object/${encodeURIComponent(name)}/fields`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        fieldCache.set(name, data);
      }

      fieldsTitle.textContent = `${label} (${name})`;
      fieldsCount.textContent = `${data.fields.length} field${data.fields.length !== 1 ? 's' : ''}`;

      const rows = data.fields.map(f => `
        <tr>
          <td class="meta-api-name">${escHtml(f.name)}</td>
          <td>${escHtml(f.label)}</td>
          <td title="${escHtml(f.type || '')}"><span class="badge bg-secondary">${escHtml(f.type || '—')}</span></td>
          <td>${f.required ? '<span class="badge badge-pass">Yes</span>' : '<span class="meta-muted">No</span>'}</td>
          <td class="meta-muted">${f.length != null ? f.length : '—'}</td>
        </tr>
      `).join('');
      fieldsBody.innerHTML = rows;

      fieldsPanel.classList.remove('d-none');
    } catch (err) {
      fieldsError.classList.remove('d-none');
      fieldsError.textContent = `Failed to load fields for ${name}.`;
    }
  }

  objectSearch.addEventListener('input', () => {
    const q = objectSearch.value.trim().toLowerCase();
    const filtered = q
      ? allObjects.filter(o => o.name.toLowerCase().includes(q) || o.label.toLowerCase().includes(q))
      : allObjects;
    renderObjectList(filtered);
  });

  function escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  loadObjects();
});
