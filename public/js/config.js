/* config.html — gestión de áreas */
(() => {
  const { $, escapeHtml, showToast, api } = App;
  const listEl = $('area-list');

  function render(areas) {
    listEl.innerHTML = areas.length
      ? areas.map((a) =>
          `<li><span>${escapeHtml(a)}</span>
            <button class="btn-del" data-area="${escapeHtml(a)}">Eliminar</button></li>`).join('')
      : '<li class="empty">Sin áreas. Agrega la primera.</li>';
    listEl.querySelectorAll('.btn-del').forEach((b) =>
      b.addEventListener('click', () => del(b.dataset.area)));
  }

  async function del(nombre) {
    if (!confirm(`¿Eliminar el área "${nombre}"?\nLos registros existentes no se modifican.`)) return;
    const res = await api.deleteArea(nombre);
    if (res && res.ok) {
      render(res.areas);
      showToast('Área eliminada', 'success');
    }
  }

  $('area-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = $('area-name').value.trim();
    if (!nombre) return;
    const res = await api.createArea(nombre);
    if (res && res.ok) {
      $('area-name').value = '';
      render(res.areas);
      showToast('Área agregada', 'success');
    } else {
      showToast((res && res.error) || 'Error al agregar', 'fail');
    }
  });

  api.listAreas().then(render);
})();
