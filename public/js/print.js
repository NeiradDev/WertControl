/* print.html — acta imprimible de un registro (A4, una hoja) */
(() => {
  const { escapeHtml, fmtDate } = App;
  const sheet = document.getElementById('sheet');

  const id = new URLSearchParams(location.search).get('id');

  const val = (v) => (v ? escapeHtml(v) : '—');

  function renderPhones(telefonos) {
    if (!telefonos || !telefonos.length) {
      return '<p class="row"><span class="v">Sin teléfonos registrados.</span></p>';
    }
    const rows = telefonos.map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${val(t.imei1 || t.serial)}</td>
        <td>${val(t.imei2)}</td>
        <td>${val(t.pin)}</td>
        <td>${t.cargador ? 'Sí' : 'No'}</td>
      </tr>`).join('');
    return `
      <table class="phones">
        <thead>
          <tr><th>#</th><th>IMEI 1</th><th>IMEI 2</th><th>PIN/Clave</th><th>Cargador</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function renderChips(chips) {
    if (!chips || !chips.length) {
      return '<p class="row"><span class="v">Sin chips registrados.</span></p>';
    }
    const rows = chips.map((c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${val(c.numero)}</td>
        <td>${val(c.operadora)}</td>
        <td>${val(c.tipo)}</td>
      </tr>`).join('');
    return `
      <table class="phones">
        <thead>
          <tr><th>#</th><th>Número</th><th>Operadora</th><th>Tipo</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function render(r) {
    const accesorios = r.accesorios && r.accesorios.length
      ? `<div class="acc-list">${r.accesorios.map((a) => `<span class="acc-chip">${escapeHtml(a)}</span>`).join('')}</div>`
      : '<span class="v">Ninguno</span>';

    const laptopBlock = r.tiene_laptop === false
      ? '<div class="rows"><div class="row"><span class="v no-tiene">No tiene laptop</span></div></div>'
      : `<div class="rows">
           <div class="row"><span class="k">Serial:</span><span class="v">${val(r.serial_laptop)}</span></div>
           <div class="row"><span class="k">Clave:</span><span class="v">${val(r.clave)}</span></div>
           <div class="row"><span class="k">Cargador:</span><span class="v">${r.cargador_laptop ? 'Sí' : 'No'}</span></div>
         </div>`;

    const telefonosBlock = r.tiene_telefono === false
      ? '<p class="v no-tiene">No tiene teléfono</p>'
      : renderPhones(r.telefonos);

    const chipsBlock = r.tiene_chip === false
      ? '<p class="v no-tiene">No tiene chips</p>'
      : renderChips(r.chips);

    const accionesBlock = r.datos_personales && r.acciones_correctivas
      ? `<div class="obs-wrap">
           <div class="section-title sub">Acciones correctivas</div>
           <div class="obs-box">${escapeHtml(r.acciones_correctivas)}</div>
         </div>`
      : '';

    sheet.innerHTML = `
      <div class="doc-head">
        <h1>Acta de Barrido de Activos</h1>
        <div class="doc-meta">
          Fecha de registro:<br><strong>${fmtDate(r.fecha)}</strong>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Datos del colaborador</div>
        <div class="rows">
          <div class="row"><span class="k">Nombre:</span><span class="v">${val(r.nombre)}</span></div>
          <div class="row"><span class="k">Cédula:</span><span class="v">${val(r.cedula)}</span></div>
          <div class="row"><span class="k">Área:</span><span class="v">${val(r.area)}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Accesorios</div>
        ${accesorios}
      </div>

      <div class="section">
        <div class="section-title">Laptop</div>
        ${laptopBlock}
      </div>

      <div class="section">
        <div class="section-title">Teléfonos</div>
        <div class="phones-block">${telefonosBlock}</div>
      </div>

      <div class="section">
        <div class="section-title">Chips / SIM</div>
        <div class="phones-block">${chipsBlock}</div>
      </div>

      <div class="section">
        <div class="section-title">Otros</div>
        <div class="rows">
          <div class="row full">
            <span class="k">Datos personales:</span>
            <span class="v">${r.datos_personales
              ? '<span class="warning-flag">El equipo contiene datos personales</span>'
              : 'No'}</span>
          </div>
        </div>
        ${accionesBlock}
        <div class="obs-wrap">
          <div class="section-title sub">Observaciones</div>
          <div class="obs-box">${r.observaciones ? escapeHtml(r.observaciones) : ''}</div>
        </div>
      </div>

      <div class="signature">
        <div class="sign-block">
          <div class="sign-line"></div>
          <div class="sign-label">Firma</div>
        </div>
        <div class="sign-block">
          <div class="sign-line"></div>
          <div class="sign-label">Cédula</div>
        </div>
      </div>`;

    document.title = `Acta - ${r.nombre || 'registro'}`;
  }

  async function load() {
    if (!id) {
      sheet.innerHTML = '<p class="placeholder">Falta el parámetro ?id</p>';
      return;
    }
    try {
      const res = await fetch(`/api/registros/${id}`);
      if (!res.ok) throw new Error('not found');
      render(await res.json());
      // Abrir el diálogo de impresión automáticamente
      setTimeout(() => window.print(), 300);
    } catch {
      sheet.innerHTML = '<p class="placeholder">Registro no encontrado.</p>';
    }
  }

  document.getElementById('btn-print').addEventListener('click', () => window.print());
  load();
})();
