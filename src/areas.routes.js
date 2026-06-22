const express = require('express');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'areas.json');
const DEFAULTS = ['Callcenter', 'Cobranzas', 'Caja', 'Operaciones'];

function read() {
  try {
    const txt = fs.readFileSync(FILE, 'utf-8').trim();
    return txt ? JSON.parse(txt) : [];
  } catch {
    // Primera vez: sembrar con las áreas por defecto.
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(DEFAULTS, null, 2));
    return [...DEFAULTS];
  }
}

const router = express.Router();

router.get('/', (req, res) => res.json(read()));

router.post('/', (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  if (!nombre) return res.status(400).json({ ok: false, error: 'nombre requerido' });

  const areas = read();
  if (!areas.some((a) => a.toLowerCase() === nombre.toLowerCase())) {
    areas.push(nombre);
    fs.writeFileSync(FILE, JSON.stringify(areas, null, 2));
  }
  res.status(201).json({ ok: true, areas: read() });
});

router.delete('/:nombre', (req, res) => {
  const nombre = decodeURIComponent(req.params.nombre);
  const areas = read().filter((a) => a.toLowerCase() !== nombre.toLowerCase());
  fs.writeFileSync(FILE, JSON.stringify(areas, null, 2));
  res.json({ ok: true, areas });
});

module.exports = router;
