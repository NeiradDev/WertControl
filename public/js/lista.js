/* lista.html — registro list + edit modal */
(() => {
  const {
    $, escapeHtml, fmtDate, showToast, bindDigitsOnly, PhoneList,
    setAccesorios, fillAreaSelect, clearErrors, validate, buildPayload, api,
  } = App;

  let allRegistros = [];
  let editingId = null;
  const phones = new PhoneList('e-phones-container');

  function renderCard(r) {
    const tiene = r.accesorios || [];
    const accesorios = App.ACCESORIOS.map((a) =>
      tiene.includes(a.label)
        ? `<span class="acc-chip">${escapeHtml(a.label)}</span>`
        : `<span class="acc-chip acc-no">${escapeHtml(a.label)}: No</span>`
    ).join('');

    const serialLaptop = (r.serial_laptop
      ? `<span class="info-value">${escapeHtml(r.serial_laptop)}</span>`
      : '<span class="info-value none">—</span>') +
      (r.cargador_laptop
        ? ' <span class="acc-chip">Cargador</span>'
        : ' <span class="acc-chip acc-no">Cargador: No</span>');

    const clave = r.clave
      ? `<span class="info-value">${escapeHtml(r.clave)}</span>`
      : '<span class="info-value none">—</span>';

    let telefonos = '<span class="info-value none">—</span>';
    if (r.telefonos && r.telefonos.length) {
      telefonos = `<div class="phones-list">${r.telefonos.map((t, i) => `
        <div class="phone-row">#${i + 1} <span>Serial:</span> ${escapeHtml(t.serial || '—')} &nbsp;<span>Chip:</span> ${escapeHtml(t.chip || '—')}${t.chip2 ? ` &nbsp;<span>Chip 2:</span> ${escapeHtml(t.chip2)}` : ''} &nbsp;<span>PIN/Clave:</span> ${escapeHtml(t.pin || '—')} &nbsp;<span>Cargador:</span> ${t.cargador ? 'Sí' : 'No'}</div>
      `).join('')}</div>`;
    }

    const obs = r.observaciones
      ? `<span class="obs-text">${escapeHtml(r.observaciones)}</span>`
      : '<span class="info-value none">Sin observaciones</span>';

    return `
      <div class="card" id="card-${r.id}">
        <div class="card-header">
          <div>
            <div class="card-title">${escapeHtml(r.nombre)}</div>
            <div class="card-cedula">CI: ${escapeHtml(r.cedula)}</div>
          </div>
          <div class="card-meta">
            <span class="tag tag-area">${escapeHtml(r.area)}</span>
            ${r.datos_personales ? '<span class="tag tag-warning">Datos personales</span>' : ''}
            <span class="tag tag-date">${fmtDate(r.fecha)}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="info-group">
            <div class="info-label">Accesorios</div>
            <div class="acc-list">${accesorios}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Serial laptop</div>
            ${serialLaptop}
          </div>
          <div class="info-group">
            <div class="info-label">Clave</div>
            ${clave}
          </div>
          <div class="info-group">
            <div class="info-label">Teléfonos</div>
            ${telefonos}
          </div>
          <div class="info-group">
            <div class="info-label">Observaciones</div>
            ${obs}
          </div>
        </div>
        <div class="card-footer">
          <button class="btn-print" data-id="${r.id}">Imprimir</button>
          <button class="btn-edit" data-id="${r.id}">Editar</button>
        </div>
      </div>`;
  }

  function render(data) {
    const container = $('list-container');
    $('count-badge').textContent = data.length;

    if (!data.length) {
      container.innerHTML = '<div class="empty"><p>📋</p><p>No hay registros aún.</p></div>';
      return;
    }

    container.innerHTML = `<div class="cards">${[...data].reverse().map(renderCard).join('')}</div>`;
    container.querySelectorAll('.btn-edit').forEach((btn) =>
      btn.addEventListener('click', () => openEdit(btn.dataset.id)));
    container.querySelectorAll('.btn-print').forEach((btn) =>
      btn.addEventListener('click', () => window.open(`/print.html?id=${btn.dataset.id}`, '_blank')));
  }

  function applySearch() {
    const q = $('search').value.toLowerCase().trim();
    const area = $('filter-area').value;

    let data = allRegistros;
    if (area) data = data.filter((r) => r.area === area);
    if (q) data = data.filter((r) =>
      r.nombre.toLowerCase().includes(q) ||
      r.cedula.includes(q) ||
      r.area.toLowerCase().includes(q));

    render(data);
  }

  async function loadData() {
    try {
      allRegistros = await api.list();
      applySearch();
    } catch {
      $('list-container').innerHTML =
        '<div class="empty"><p>⚠️</p><p>Error al cargar registros.</p></div>';
    }
  }

  function openEdit(id) {
    const r = allRegistros.find((x) => String(x.id) === String(id));
    if (!r) return;
    editingId = String(r.id);

    $('e-nombre').value = r.nombre || '';
    $('e-cedula').value = r.cedula || '';
    $('e-area').value = r.area || '';
    setAccesorios('e-', r.accesorios || []);
    $('e-serial-laptop').value = r.serial_laptop || '';
    $('e-cargador-laptop').checked = !!r.cargador_laptop;
    $('e-clave').value = r.clave || '';
    $('e-datos-personales').checked = !!r.datos_personales;
    $('e-observaciones').value = r.observaciones || '';
    phones.reset(r.telefonos);

    clearErrors($('edit-form'));
    $('edit-modal').classList.add('open');
  }

  function closeEditModal() {
    $('edit-modal').classList.remove('open');
    editingId = null;
  }

  function loadAreas() {
    return api.listAreas().then((areas) => {
      fillAreaSelect($('filter-area'), areas, { all: true });
      fillAreaSelect($('e-area'), areas);
    });
  }

  bindDigitsOnly($('e-cedula'));
  $('e-btn-add-phone').addEventListener('click', () => phones.add());
  $('btn-close-modal').addEventListener('click', closeEditModal);
  $('btn-cancel-edit').addEventListener('click', closeEditModal);
  $('search').addEventListener('input', applySearch);
  $('filter-area').addEventListener('change', applySearch);

  $('edit-modal').addEventListener('click', (e) => {
    if (e.target === $('edit-modal')) closeEditModal();
  });

  $('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate('e-', $('e-phones-container'))) return;

    const btn = $('btn-save-edit');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const payload = buildPayload('e-', phones);
    try {
      const res = await api.update(editingId, payload);
      if (!res.ok) throw new Error('update failed');

      const idx = allRegistros.findIndex((r) => String(r.id) === editingId);
      if (idx !== -1) allRegistros[idx] = { ...allRegistros[idx], ...payload };

      closeEditModal();
      applySearch();
      showToast('Registro actualizado', 'success');
    } catch {
      showToast('Error al guardar. Intente nuevamente.', 'fail');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar cambios';
    }
  });

  loadAreas();
  loadData();
})();
