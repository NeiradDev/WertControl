/* lista.html — registro list + edit modal */
(() => {
  const {
    $, escapeHtml, fmtDate, showToast, bindDigitsOnly, PhoneList, ChipList,
    setAccesorios, fillAreaSelect, clearErrors, validate, buildPayload, api,
  } = App;

  let allRegistros = [];
  let editingId = null;
  const phones = new PhoneList('e-phones-container');
  const editChips = new ChipList('e-chips-container');

  function renderCard(r) {
    const tiene = r.accesorios || [];
    const accesorios = App.ACCESORIOS.map((a) =>
      tiene.includes(a.label)
        ? `<span class="acc-chip">${escapeHtml(a.label)}</span>`
        : `<span class="acc-chip acc-no">${escapeHtml(a.label)}: No</span>`
    ).join('');

    const noTiene = '<span class="info-value none">No tiene</span>';

    // Laptop
    let laptop;
    if (r.tiene_laptop === false) {
      laptop = noTiene;
    } else {
      const serial = r.serial_laptop && r.serial_laptop !== 'NO TIENE'
        ? escapeHtml(r.serial_laptop) : '—';
      const clave = r.clave && r.clave !== 'NO TIENE'
        ? escapeHtml(r.clave) : '—';
      laptop = `<div class="info-inline">
        <span><span class="info-sub">Serial:</span> ${serial}</span>
        <span><span class="info-sub">Clave:</span> ${clave}</span>
        ${r.cargador_laptop ? '<span class="acc-chip">Cargador</span>' : '<span class="acc-chip acc-no">Sin cargador</span>'}
      </div>`;
    }

    // Teléfonos
    let telefonos;
    if (r.tiene_telefono === false) {
      telefonos = noTiene;
    } else if (r.telefonos && r.telefonos.length) {
      telefonos = `<div class="phones-list">${r.telefonos.map((t, i) => `
        <div class="phone-row">#${i + 1}
          <span class="info-sub">IMEI 1:</span> ${escapeHtml(t.imei1 || t.serial || '—')}
          &nbsp;<span class="info-sub">IMEI 2:</span> ${escapeHtml(t.imei2 || '—')}
          &nbsp;<span class="info-sub">PIN:</span> ${escapeHtml(t.pin || '—')}
          &nbsp;${t.cargador ? '<span class="acc-chip">Cargador</span>' : '<span class="acc-chip acc-no">Sin cargador</span>'}
        </div>`).join('')}</div>`;
    } else {
      telefonos = '<span class="info-value none">—</span>';
    }

    // Chips
    let chips;
    if (r.tiene_chip === false) {
      chips = noTiene;
    } else if (r.chips && r.chips.length) {
      chips = `<div class="phones-list">${r.chips.map((c, i) => `
        <div class="phone-row">#${i + 1}
          <span class="info-sub">N°:</span> ${escapeHtml(c.numero || '—')}
          &nbsp;<span class="info-sub">Operadora:</span> ${escapeHtml(c.operadora || '—')}
          &nbsp;<span class="acc-chip acc-tipo">${escapeHtml(c.tipo || '—')}</span>
        </div>`).join('')}</div>`;
    } else {
      chips = '<span class="info-value none">—</span>';
    }

    const obs = r.observaciones
      ? `<span class="obs-text">${escapeHtml(r.observaciones)}</span>`
      : '<span class="info-value none">Sin observaciones</span>';

    const accionesBlock = r.datos_personales && r.acciones_correctivas
      ? `<div class="info-group">
           <div class="info-label">Acciones correctivas</div>
           <span class="obs-text">${escapeHtml(r.acciones_correctivas)}</span>
         </div>`
      : '';

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
            <div class="info-label">Laptop</div>
            ${laptop}
          </div>
          <div class="info-group">
            <div class="info-label">Teléfonos</div>
            ${telefonos}
          </div>
          <div class="info-group">
            <div class="info-label">Chips</div>
            ${chips}
          </div>
          ${accionesBlock}
          <div class="info-group">
            <div class="info-label">Observaciones</div>
            ${obs}
          </div>
        </div>
        <div class="card-footer">
          <button class="btn-print" data-id="${r.id}">Imprimir</button>
          <button class="btn-label" data-id="${r.id}">Etiqueta</button>
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
    container.querySelectorAll('.btn-label').forEach((btn) =>
      btn.addEventListener('click', () => window.open(`/label.html?id=${btn.dataset.id}`, '_blank')));
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

  function setEquipoSection(sectionId, enabled) {
    document.getElementById(sectionId).classList.toggle('disabled', !enabled);
  }

  function openEdit(id) {
    const r = allRegistros.find((x) => String(x.id) === String(id));
    if (!r) return;
    editingId = String(r.id);

    $('e-nombre').value = r.nombre || '';
    $('e-cedula').value = r.cedula || '';
    $('e-area').value = r.area || '';
    setAccesorios('e-', r.accesorios || []);

    const tieneLaptop = r.tiene_laptop !== false;
    const tieneTelefono = r.tiene_telefono !== false;
    const tieneChip = r.tiene_chip !== false;

    $('e-tiene-laptop').checked = tieneLaptop;
    $('e-tiene-telefono').checked = tieneTelefono;
    $('e-tiene-chip').checked = tieneChip;
    setEquipoSection('e-laptop-section', tieneLaptop);
    setEquipoSection('e-telefono-section', tieneTelefono);
    setEquipoSection('e-chip-section', tieneChip);

    $('e-serial-laptop').value = tieneLaptop ? (r.serial_laptop === 'NO TIENE' ? '' : r.serial_laptop || '') : '';
    $('e-cargador-laptop').checked = !!r.cargador_laptop;
    $('e-clave').value = tieneLaptop ? (r.clave === 'NO TIENE' ? '' : r.clave || '') : '';
    $('e-datos-personales').checked = !!r.datos_personales;
    setEquipoSection('e-acciones-section', !!r.datos_personales);
    $('e-acciones-correctivas').value = r.acciones_correctivas || '';
    $('e-observaciones').value = r.observaciones || '';
    phones.reset(r.telefonos);
    editChips.reset(r.chips);

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
  $('e-tiene-laptop').addEventListener('change', (e) => setEquipoSection('e-laptop-section', e.target.checked));
  $('e-tiene-telefono').addEventListener('change', (e) => setEquipoSection('e-telefono-section', e.target.checked));
  $('e-tiene-chip').addEventListener('change', (e) => setEquipoSection('e-chip-section', e.target.checked));
  $('e-datos-personales').addEventListener('change', (e) => setEquipoSection('e-acciones-section', e.target.checked));
  $('e-btn-add-chip').addEventListener('click', () => editChips.add());
  $('btn-close-modal').addEventListener('click', closeEditModal);
  $('btn-cancel-edit').addEventListener('click', closeEditModal);
  $('search').addEventListener('input', applySearch);
  $('filter-area').addEventListener('change', applySearch);

  $('edit-modal').addEventListener('click', (e) => {
    if (e.target === $('edit-modal')) closeEditModal();
  });

  $('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const chipCont = $('e-tiene-chip').checked ? $('e-chips-container') : null;
    if (!validate('e-', $('e-phones-container'), chipCont)) return;

    const btn = $('btn-save-edit');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const payload = buildPayload('e-', phones, editChips);
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

  // ── Barcode scanner ──
  let scanStream = null;
  let scanRaf = null;
  let barcodeDetector = null;

  const scanOverlay    = document.getElementById('scan-overlay');
  const scanCameraMode = document.getElementById('scan-camera-mode');
  const scanManualMode = document.getElementById('scan-manual-mode');
  const scanInput      = document.getElementById('scan-input');

  function applyScanned(value) {
    closeScanner();
    $('search').value = value;
    applySearch();
  }

  function closeScanner() {
    cancelAnimationFrame(scanRaf);
    if (scanStream) { scanStream.getTracks().forEach((t) => t.stop()); scanStream = null; }
    scanOverlay.classList.remove('open');
    scanInput.value = '';
  }

  async function openScanner() {
    scanOverlay.classList.add('open');

    // Cámara solo disponible en contexto seguro (HTTPS o localhost)
    const canCamera = !!(navigator.mediaDevices && window.isSecureContext);

    if (canCamera) {
      scanCameraMode.style.display = '';
      scanManualMode.style.display = 'none';
      try {
        barcodeDetector = barcodeDetector || new BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'upc_a'] });
        scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.getElementById('scan-video');
        video.srcObject = scanStream;
        await video.play();
        scanLoop();
        return;
      } catch { /* cámara denegada → caer a modo manual */ }
    }

    // Modo manual: lector USB o teclado
    scanCameraMode.style.display = 'none';
    scanManualMode.style.display = '';
    scanInput.focus();
  }

  async function scanLoop() {
    if (!scanStream) return;
    try {
      const barcodes = await barcodeDetector.detect(document.getElementById('scan-video'));
      if (barcodes.length) { applyScanned(barcodes[0].rawValue); return; }
    } catch { /* frame inválido */ }
    scanRaf = requestAnimationFrame(scanLoop);
  }

  // Lector USB / teclado: confirma con Enter o cuando llegan 10 dígitos seguidos
  scanInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && scanInput.value.trim()) applyScanned(scanInput.value.trim());
  });
  scanInput.addEventListener('input', () => {
    if (/^\d{10}$/.test(scanInput.value.trim())) applyScanned(scanInput.value.trim());
  });

  $('btn-scan').addEventListener('click', openScanner);
  $('btn-close-scan').addEventListener('click', closeScanner);
  scanOverlay.addEventListener('click', (e) => { if (e.target === scanOverlay) closeScanner(); });

  loadAreas();
  loadData();
})();
