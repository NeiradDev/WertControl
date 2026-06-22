const express = require('express');
const store = require('./store');
const { buildWorkbook } = require('./excel');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(store.readAll());
});

// Exporta todos los registros a un archivo .xlsx (debe ir antes de /:id).
router.get('/export', async (req, res) => {
  const wb = await buildWorkbook(store.readAll());
  const fecha = new Date().toISOString().slice(0, 10);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="registros_${fecha}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

router.get('/:id', (req, res) => {
  const registro = store.getById(req.params.id);
  if (!registro) return res.status(404).json({ ok: false });
  res.json(registro);
});

router.post('/', (req, res) => {
  const registro = store.create(req.body);
  res.status(201).json({ ok: true, id: registro.id });
});

router.put('/:id', (req, res) => {
  const registro = store.update(req.params.id, req.body);
  if (!registro) return res.status(404).json({ ok: false });
  res.json({ ok: true });
});

module.exports = router;
