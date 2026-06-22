const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'registros.json');

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, '[]');
  }
}

function readAll() {
  ensureFile();
  const txt = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  return txt ? JSON.parse(txt) : [];
}

function writeAll(registros) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(registros, null, 2));
}

function getById(id) {
  return readAll().find((r) => String(r.id) === String(id)) || null;
}

function create(data) {
  const registros = readAll();
  const registro = { ...data, id: Date.now(), fecha: new Date().toISOString() };
  registros.push(registro);
  writeAll(registros);
  return registro;
}

function update(id, data) {
  const registros = readAll();
  const idx = registros.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  registros[idx] = { ...registros[idx], ...data };
  writeAll(registros);
  return registros[idx];
}

module.exports = { readAll, getById, create, update };
