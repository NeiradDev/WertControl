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
      const list = phones && phones.length ? phones : [{ imei1: '', imei2: '', pin: '', cargador: false }];
      list.forEach((p) => this.add(p));
    }

    add(phone = { imei1: '', imei2: '', pin: '', cargador: false }) {
      const n = this.container.querySelectorAll('.phone-entry').length + 1;
      // ponytail: imei1 falls back to legacy serial field for old records
      const imei1 = phone.imei1 || phone.serial || '';
      const div = document.createElement('div');
      div.className = 'phone-entry';
      div.innerHTML = `
        <input type="text" placeholder="IMEI 1 #${n}" data-role="imei1" value="${escapeHtml(imei1)}">
        <input type="text" placeholder="IMEI 2 #${n}" data-role="imei2" value="${escapeHtml(phone.imei2 || '')}">
        <input type="text" placeholder="PIN/Clave #${n}" data-role="pin" value="${escapeHtml(phone.pin || '')}">
        <label class="phone-cargador" title="Cargador teléfono">
          <input type="checkbox" data-role="cargador" ${phone.cargador ? 'checked' : ''}>
          Cargador
        </label>
        <button type="button" class="btn-remove" title="Quitar">×</button>`;
      div.querySelector('.btn-remove').addEventListener('click', () => {
        div.remove();
        this._renumber();
      });
      this.container.appendChild(div);
    }

    _renumber() {
      this.container.querySelectorAll('.phone-entry').forEach((entry, idx) => {
        const n = idx + 1;
        entry.querySelector('[data-role="imei1"]').placeholder = `IMEI 1 #${n}`;
        entry.querySelector('[data-role="imei2"]').placeholder = `IMEI 2 #${n}`;
        entry.querySelector('[data-role="pin"]').placeholder = `PIN/Clave #${n}`;
      });
    }

    collect() {
      const phones = [];
      this.container.querySelectorAll('.phone-entry').forEach((entry) => {
        const imei1 = normalize(entry.querySelector('[data-role="imei1"]').value.trim());
        const imei2 = normalize(entry.querySelector('[data-role="imei2"]').value.trim());
        const pin = entry.querySelector('[data-role="pin"]').value.trim();
        const cargador = entry.querySelector('[data-role="cargador"]').checked;
        if (imei1 || imei2 || pin || cargador) phones.push({ imei1, imei2, pin, cargador });
      });
      return phones;
    }
  }

  // Manages the dynamic list of SIM chip entries inside a container.
  class ChipList {
    constructor(containerId) {
      this.container = $(containerId);
    }

    reset(chips) {
      this.container.innerHTML = '';
      const list = chips && chips.length ? chips : [{ numero: '', operadora: '', tipo: 'prepago' }];
      list.forEach((c) => this.add(c));
    }

    add(chip = { numero: '', operadora: '', tipo: 'prepago' }) {
      const n = this.container.querySelectorAll('.chip-entry').length + 1;
      const div = document.createElement('div');
      div.className = 'chip-entry';
      div.innerHTML = `
        <input type="text" placeholder="Número #${n}" data-role="numero" value="${escapeHtml(chip.numero || '')}" maxlength="10">
        <input type="text" placeholder="Operadora" data-role="operadora" value="${escapeHtml(chip.operadora || '')}">
        <select data-role="tipo">
          <option value="prepago" ${(chip.tipo || 'prepago') === 'prepago' ? 'selected' : ''}>Prepago</option>
          <option value="postpago" ${chip.tipo === 'postpago' ? 'selected' : ''}>Postpago</option>
        </select>
        <button type="button" class="btn-remove" title="Quitar">×</button>`;
      bindDigitsOnly(div.querySelector('[data-role="numero"]'));
      div.querySelector('.btn-remove').addEventListener('click', () => {
        div.remove();
        this._renumber();
      });
      this.container.appendChild(div);
    }

    _renumber() {
      this.container.querySelectorAll('.chip-entry').forEach((entry, idx) => {
        entry.querySelector('[data-role="numero"]').placeholder = `Número #${idx + 1}`;
      });
    }

    collect() {
      const chips = [];
      this.container.querySelectorAll('.chip-entry').forEach((entry) => {
        const numero = entry.querySelector('[data-role="numero"]').value.trim();
        const operadora = normalize(entry.querySelector('[data-role="operadora"]').value.trim());
        const tipo = entry.querySelector('[data-role="tipo"]').value;
        if (numero || operadora) chips.push({ numero, operadora, tipo });
      });
      return chips;
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

  // Validates nombre/cedula/area. chipContainer optional — validates número (10 digits if filled).
  function validate(prefix, phoneContainer, chipContainer) {
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

    if (chipContainer) {
      chipContainer.querySelectorAll('[data-role="numero"]').forEach((input) => {
        const v = input.value.trim();
        const numOk = !v || /^\d{10}$/.test(v);
        input.classList.toggle('error', !numOk);
        if (!numOk) ok = false;
      });
    }

    return ok;
  }

  // Builds the registro payload from form fields. `prefix` is '' or 'e-'.
  const buildPayload = (prefix, phoneList, chipList) => {
    const tieneLaptop = $(prefix + 'tiene-laptop')?.checked ?? true;
    const tieneTelefono = $(prefix + 'tiene-telefono')?.checked ?? true;
    const tieneChip = $(prefix + 'tiene-chip')?.checked ?? true;
    return {
      nombre: normalize($(prefix + 'nombre').value.trim()),
      cedula: $(prefix + 'cedula').value.trim(),
      area: $(prefix + 'area').value,
      accesorios: collectAccesorios(prefix),
      tiene_laptop: tieneLaptop,
      serial_laptop: tieneLaptop ? normalize($(prefix + 'serial-laptop').value.trim()) : 'NO TIENE',
      cargador_laptop: tieneLaptop && $(prefix + 'cargador-laptop').checked,
      clave: tieneLaptop ? $(prefix + 'clave').value.trim() : 'NO TIENE',
      tiene_telefono: tieneTelefono,
      telefonos: tieneTelefono ? phoneList.collect() : [],
      tiene_chip: tieneChip,
      chips: tieneChip && chipList ? chipList.collect() : [],
      datos_personales: $(prefix + 'datos-personales').checked,
      acciones_correctivas: $(prefix + 'datos-personales').checked
        ? $(prefix + 'acciones-correctivas').value.trim()
        : '',
      observaciones: normalize($(prefix + 'observaciones').value.trim()),
    };
  };

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
    ACCESORIOS, collectAccesorios, setAccesorios, PhoneList, ChipList,
    fillAreaSelect, setError, clearErrors, validate, buildPayload, api,
  };
})();
