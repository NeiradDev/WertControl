/* index.html — new registro form */
(() => {
  const { $, showToast, bindDigitsOnly, PhoneList, fillAreaSelect, clearErrors, validate, buildPayload, api } = App;

  const phones = new PhoneList('phones-container');
  phones.add();

  bindDigitsOnly($('cedula'));
  $('btn-add-phone').addEventListener('click', () => phones.add());

  api.listAreas().then((areas) => fillAreaSelect($('area'), areas));

  function resetForm() {
    $('form').reset();
    phones.reset();
    clearErrors($('form'));
  }

  $('btn-reset').addEventListener('click', resetForm);

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate('', $('phones-container'))) return;

    const btn = $('btn-submit');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      const res = await api.create(buildPayload('', phones));
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
