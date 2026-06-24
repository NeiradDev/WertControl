/* index.html — new registro form */
(() => {
  const { $, showToast, bindDigitsOnly, PhoneList, ChipList, fillAreaSelect, clearErrors, validate, buildPayload, api } = App;

  const phones = new PhoneList('phones-container');
  phones.add();

  const chips = new ChipList('chips-container');
  chips.add();

  bindDigitsOnly($('cedula'));
  $('btn-add-phone').addEventListener('click', () => phones.add());
  $('btn-add-chip').addEventListener('click', () => chips.add());

  api.listAreas().then((areas) => fillAreaSelect($('area'), areas));

  function setEquipoSection(sectionId, enabled) {
    document.getElementById(sectionId).classList.toggle('disabled', !enabled);
  }

  $('tiene-laptop').addEventListener('change', (e) => setEquipoSection('laptop-section', e.target.checked));
  $('tiene-telefono').addEventListener('change', (e) => setEquipoSection('telefono-section', e.target.checked));
  $('tiene-chip').addEventListener('change', (e) => setEquipoSection('chip-section', e.target.checked));
  $('datos-personales').addEventListener('change', (e) => setEquipoSection('acciones-section', e.target.checked));

  function resetForm() {
    $('form').reset();
    phones.reset();
    chips.reset();
    clearErrors($('form'));
    setEquipoSection('laptop-section', false);
    setEquipoSection('telefono-section', false);
    setEquipoSection('chip-section', false);
    setEquipoSection('acciones-section', false);
  }

  $('btn-reset').addEventListener('click', resetForm);

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const chipCont = $('tiene-chip').checked ? $('chips-container') : null;
    if (!validate('', $('phones-container'), chipCont)) return;

    const btn = $('btn-submit');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      const res = await api.create(buildPayload('', phones, chips));
      if (!res.ok) throw new Error('save failed');
      showToast('Registro guardado correctamente', 'success');
      resetForm();
    } catch {
      showToast('Error al guardar. Intente nuevamente.', 'fail');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar registro';
    }
  });
})();
