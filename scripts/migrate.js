/**
 * Migra registros.json del esquema v1 al v2:
 *   - telefonos: { serial, chip, chip2, pin, cargador }
 *     → { imei1, imei2, pin, cargador }
 *   - chips (ex chip/chip2 de cada teléfono) → array independiente
 *   - agrega tiene_laptop, tiene_telefono, tiene_chip, acciones_correctivas
 *
 * Idempotente: registros ya migrados no se tocan.
 * Crea backup en data/registros.bak.json antes de escribir.
 */

const fs = require('fs');
const path = require('path');

const DATA  = path.join(__dirname, '..', 'data', 'registros.json');
const BACKUP = DATA.replace('.json', '.bak.json');

function migrateOne(r) {
  const out = { ...r };

  // ── tiene_laptop ──────────────────────────────────────────────
  if (out.tiene_laptop === undefined) {
    out.tiene_laptop = out.serial_laptop
      ? out.serial_laptop !== 'NO TIENE'
      : false;
  }

  // ── telefonos: serial → imei1, extraer chips ──────────────────
  const extractedChips = [];

  out.telefonos = (out.telefonos || []).map((t) => {
    // Chips extraídos del formato viejo
    if (t.chip)  extractedChips.push({ numero: t.chip,  operadora: '', tipo: 'prepago' });
    if (t.chip2) extractedChips.push({ numero: t.chip2, operadora: '', tipo: 'prepago' });

    return {
      imei1:    t.imei1 !== undefined ? t.imei1 : (t.serial || ''),
      imei2:    t.imei2  || '',
      pin:      t.pin    || '',
      cargador: t.cargador || false,
    };
  });

  // ── tiene_telefono ────────────────────────────────────────────
  if (out.tiene_telefono === undefined) {
    out.tiene_telefono = out.telefonos.some(
      (t) => t.imei1 || t.imei2 || t.pin || t.cargador
    );
  }

  // ── chips: usar existentes o los extraídos de teléfonos ───────
  if (!out.chips || !out.chips.length) {
    out.chips = extractedChips;
  }

  if (out.tiene_chip === undefined) {
    out.tiene_chip = out.chips.length > 0;
  }

  // ── acciones_correctivas ──────────────────────────────────────
  if (out.acciones_correctivas === undefined) {
    out.acciones_correctivas = '';
  }

  return out;
}

// ── Main ─────────────────────────────────────────────────────────
const raw = fs.existsSync(DATA) ? fs.readFileSync(DATA, 'utf-8').trim() : '[]';
const registros = raw ? JSON.parse(raw) : [];

if (!registros.length) {
  console.log('Sin registros. Nada que migrar.');
  process.exit(0);
}

// Backup
fs.copyFileSync(DATA, BACKUP);
console.log(`Backup guardado en ${BACKUP}`);

const migrados = registros.map(migrateOne);
fs.writeFileSync(DATA, JSON.stringify(migrados, null, 2));

console.log(`Migrados: ${migrados.length} registros → ${DATA}`);
