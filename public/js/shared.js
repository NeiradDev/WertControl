/* Shared helpers for form (index) and edit modal (lista). Exposed as window.App. */
window.App = (() => {
  const $ = (id) => document.getElementById(id);

  const normalize = (str) =>
    str.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
    );
  };

  function showToast(msg, type) {
    const t = $('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => { t.className = 'toast'; }, 3000);
  }

  // Restrict an input to digits, capped at `max` characters.
  function bindDigitsOnly(input, max = 10) {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, max);
    });
  }

  // Single source of truth for accessory checkboxes.
  const ACCESORIOS = [
    { id: 'acc-mouse', label: 'Mouse' },
    { id: 'acc-mousepad', label: 'Mousepad' },
    { id: 'acc-ventilador', label: 'Ventilador' },
  ];

  const collectAccesorios = (prefix = '') =>
    ACCESORIOS.filter((a) => $(prefix + a.id).checked).map((a) => a.label);

  const setAccesorios = (prefix, accesorios = []) =>
    ACCESORIOS.forEach((a) => { $(prefix + a.id).checked = accesorios.includes(a.label); });

  // Manages the dynamic list of phone entries inside a container.
  class PhoneList {
    constructor(containerId) {
      this.container = $(containerId);
    }

    reset(phones) {
      this.container.innerHTML = '';
      const list = phones && phones.length ? phones : [{ serial: '', chip: '', pin: '', cargador: false }];
      list.forEach((p) => this.add(p));
    }

    // Crea el input del segundo chip dentro de su celda (reemplaza el botón).
    _addChip2Input(cell, value = '') {
      cell.innerHTML = `<input type="text" placeholder="Chip 2" data-role="chip2" value="${value}" maxlength="10">`;
      const inp = cell.querySelector('input');
      bindDigitsOnly(inp);
      return inp;
    }

    add(phone = { serial: '', chip: '', chip2: '', pin: '', cargador: false }) {
      const n = this.container.querySelectorAll('.phone-entry').length + 1;
      const digits = (v) => String(v || '').replace(/\D/g, '').slice(0, 10);
      const div = document.createElement('div');
      div.className = 'phone-entry';
      div.innerHTML = `
        <input type="text" placeholder="Serial #${n}" data-role="serial" value="${escapeHtml(phone.serial || '')}">
        <input type="text" placeholder="Chip #${n}" data-role="chip" value="${digits(phone.chip)}" maxlength="10">
        <div class="chip2-cell"></div>
        <input type="text" placeholder="PIN/Clave #${n}" data-role="pin" value="${escapeHtml(phone.pin || '')}">
        <label class="phone-cargador" title="Cargador teléfono">
          <input type="checkbox" data-role="cargador" ${phone.cargador ? 'checked' : ''}>
          Cargador
        </label>
        <button type="button" class="btn-remove" title="Quitar">×</button>`;
      bindDigitsOnly(div.querySelector('[data-role="chip"]'));

      // Segundo chip: opcional. Con valor previo se muestra el input; si no, un botón.
      const chip2Cell = div.querySelector('.chip2-cell');
      if (phone.chip2) {
        this._addChip2Input(chip2Cell, digits(phone.chip2));
      } else {
        chip2Cell.innerHTML = '<button type="button" class="btn-chip2" title="Agregar segundo chip">+ Chip 2</button>';
        chip2Cell.querySelector('.btn-chip2').addEventListener('click', () =>
          this._addChip2Input(chip2Cell).focus());
      }

      div.querySelector('.btn-remove').addEventListener('click', () => {
        div.remove();
        this._renumber();
      });
      this.container.appendChild(div);
    }

    _renumber() {
      this.container.querySelectorAll('.phone-entry').forEach((entry, idx) => {
        const n = idx + 1;
        entry.querySelector('[data-role="serial"]').placeholder = `Serial #${n}`;
        entry.querySelector('[data-role="chip"]').placeholder = `Chip #${n}`;
        entry.querySelector('[data-role="pin"]').placeholder = `PIN/Clave #${n}`;
      });
    }

    collect() {
      const phones = [];
      this.container.querySelectorAll('.phone-entry').forEach((entry) => {
        const serial = normalize(entry.querySelector('[data-role="serial"]').value.trim());
        const chip = entry.querySelector('[data-role="chip"]').value.trim();
        const chip2El = entry.querySelector('[data-role="chip2"]');
        const chip2 = chip2El ? chip2El.value.trim() : '';
        const pin = entry.querySelector('[data-role="pin"]').value.trim();
        const cargador = entry.querySelector('[data-role="cargador"]').checked;
        if (serial || chip || chip2 || pin || cargador) phones.push({ serial, chip, chip2, pin, cargador });
      });
      return phones;
    }
  }

  function setError(fieldId, errId, show) {
    $(fieldId).classList.toggle('error', show);
    $(errId).classList.toggle('visible', show);
  }

  function clearErrors(scope) {
    scope.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));
    scope.querySelectorAll('.error-msg').forEach((el) => el.classList.remove('visible'));
  }

  // Validates nombre/cedula/area + chip fields. `prefix` is '' (form) or 'e-' (edit).
  function validate(prefix, phoneContainer) {
    let ok = true;
    const field = (name) => $(prefix + name).value.trim();

    const nombreEmpty = !field('nombre');
    setError(prefix + 'nombre', prefix + 'err-nombre', nombreEmpty);
    if (nombreEmpty) ok = false;

    const cedulaOk = /^\d{10}$/.test(field('cedula'));
    setError(prefix + 'cedula', prefix + 'err-cedula', !cedulaOk);
    if (!cedulaOk) ok = false;

    const areaEmpty = !$(prefix + 'area').value;
    setError(prefix + 'area', prefix + 'err-area', areaEmpty);
    if (areaEmpty) ok = false;

    phoneContainer.querySelectorAll('[data-role^="chip"]').forEach((input) => {
      const v = input.value.trim();
      const chipOk = !v || /^\d{10}$/.test(v);
      input.classList.toggle('error', !chipOk);
      if (!chipOk) ok = false;
    });

    return ok;
  }

  // Builds the registro payload from form fields. `prefix` is '' or 'e-'.
  const buildPayload = (prefix, phoneList) => ({
    nombre: normalize($(prefix + 'nombre').value.trim()),
    cedula: $(prefix + 'cedula').value.trim(),
    area: $(prefix + 'area').value,
    accesorios: collectAccesorios(prefix),
    serial_laptop: normalize($(prefix + 'serial-laptop').value.trim()),
    cargador_laptop: $(prefix + 'cargador-laptop').checked,
    clave: $(prefix + 'clave').value.trim(),
    telefonos: phoneList.collect(),
    datos_personales: $(prefix + 'datos-personales').checked,
    observaciones: normalize($(prefix + 'observaciones').value.trim()),
  });

  const JSON_HEADERS = { 'Content-Type': 'application/json' };
  const api = {
    list: () => fetch('/api/registros').then((r) => {
      if (!r.ok) throw new Error('list failed');
      return r.json();
    }),
    create: (payload) =>
      fetch('/api/registros', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) }),
    update: (id, payload) =>
      fetch(`/api/registros/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(payload) }),
    listAreas: () => fetch('/api/areas').then((r) => r.json()),
    createArea: (nombre) =>
      fetch('/api/areas', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ nombre }) })
        .then((r) => r.json()),
    deleteArea: (nombre) =>
      fetch(`/api/areas/${encodeURIComponent(nombre)}`, { method: 'DELETE' }).then((r) => r.json()),
  };

  // Llena un <select> de áreas. all=true => opción "Todas" (para filtro).
  function fillAreaSelect(sel, areas, { all = false, selected = '' } = {}) {
    const opts = all
      ? ['<option value="">Todas las áreas</option>']
      : [`<option value="" disabled ${selected ? '' : 'selected'}>Seleccionar área</option>`];
    areas.forEach((a) =>
      opts.push(`<option value="${escapeHtml(a)}"${a === selected ? ' selected' : ''}>${escapeHtml(a)}</option>`));
    sel.innerHTML = opts.join('');
  }

  return {
    $, normalize, escapeHtml, fmtDate, showToast, bindDigitsOnly,
    ACCESORIOS, collectAccesorios, setAccesorios, PhoneList,
    fillAreaSelect, setError, clearErrors, validate, buildPayload, api,
  };
})();
