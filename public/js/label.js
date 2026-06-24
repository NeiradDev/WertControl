/* label.html — etiqueta con código de barras para impresora 3NSTAR LDT114 */
(() => {
  const { escapeHtml } = App;
  const label = document.getElementById('label');
  const id = new URLSearchParams(location.search).get('id');

  async function load() {
    if (!id) { label.innerHTML = '<p class="placeholder">Falta ?id</p>'; return; }
    try {
      const res = await fetch(`/api/registros/${id}`);
      if (!res.ok) throw new Error();
      render(await res.json());
    } catch {
      label.innerHTML = '<p class="placeholder">Registro no encontrado</p>';
    }
  }

  function render(r) {
    label.innerHTML = `
      <div class="label-nombre">${escapeHtml(r.nombre)}</div>
      <div class="label-area">${escapeHtml(r.area)}</div>
      <svg id="barcode"></svg>
      <div class="label-cedula">${escapeHtml(r.cedula)}</div>`;

    JsBarcode('#barcode', r.cedula, {
      format: 'CODE128',
      width: 1.4,
      height: 28,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000',
    });

    document.title = `Etiqueta — ${r.nombre}`;
    setTimeout(() => window.print(), 400);
  }

  document.getElementById('btn-print').addEventListener('click', () => window.print());
  load();
})();
