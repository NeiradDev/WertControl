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
        <td>${val(t.serial)}</td>
        <td>${val(t.chip)}</td>
        <td>${val(t.chip2)}</td>
        <td>${val(t.pin)}</td>
        <td>${t.cargador ? 'Sí' : 'No'}</td>
      </tr>`).join('');
    return `
      <table class="phones">
        <thead>
          <tr><th>#</th><th>Serial</th><th>Chip</th><th>Chip 2</th><th>PIN/Clave</th><th>Cargador</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function render(r) {
    const accesorios = r.accesorios && r.accesorios.length
      ? `<div class="acc-list">${r.accesorios.map((a) => `<span class="acc-chip">${escapeHtml(a)}</span>`).join('')}</div>`
      : '<span class="v">Ninguno</span>';

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
        <div class="section-title">Equipos</div>
        <div class="rows">
          <div class="row"><span class="k">Serial laptop:</span><span class="v">${val(r.serial_laptop)}</span></div>
          <div class="row"><span class="k">Cargador laptop:</span><span class="v">${r.cargador_laptop ? 'Sí' : 'No'}</span></div>
          <div class="row"><span class="k">Clave:</span><span class="v">${val(r.clave)}</span></div>
        </div>
        <div class="phones-block">${renderPhones(r.telefonos)}</div>
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
