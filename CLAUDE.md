# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start          # node server.js — http://localhost:3000
```

No tests, no linter. Use `yarn`, never `npm`.

## Architecture

Express server (`server.js`) serves static files from `public/` and a REST API under `/api`. No bundler, no framework — vanilla HTML/CSS/JS.

```
server.js                   # Express entry, PORT 3000
src/
  store.js                  # JSON file store → data/registros.json
  registros.routes.js       # GET/POST/PUT + /export (.xlsx)
  areas.routes.js           # GET/POST/DELETE for area list
  excel.js                  # ExcelJS workbook builder ⚠ needs update (see below)
public/
  index.html + js/form.js   # New registro form
  lista.html + js/lista.js  # List + edit modal
  print.html + js/print.js  # Printable acta (A4)
  config.html               # Area management
  js/shared.js              # window.App — all shared logic
  css/base.css              # Shared styles (form + modal)
  css/lista.css             # List/card styles
  css/print.css             # Print styles
```

## Shared JS (`window.App`)

All frontend logic lives in `public/js/shared.js` as `window.App`. Key exports:

- **`PhoneList(containerId)`** — dynamic phone entries. Each entry: `{ imei1, imei2, pin, cargador }`. Legacy records may have `serial` instead of `imei1` (handled in `add()`).
- **`ChipList(containerId)`** — dynamic SIM entries. Each entry: `{ numero, operadora, tipo }`. `tipo` is `'prepago'|'postpago'`.
- **`buildPayload(prefix, phoneList, chipList)`** — reads form fields, returns API payload. `prefix` is `''` (new form) or `'e-'` (edit modal).
- **`validate(prefix, phoneContainer, chipContainer)`** — validates nombre, cédula (10 digits), área, and chip números (10 digits if filled). `chipContainer` is `null` when chip section is disabled.
- **`normalize(str)`** — strips accents + uppercases. Applied to all text fields before save.

## Form/Modal prefix pattern

The new-registro form and the edit modal share all JS logic via a `prefix` string:
- New form: `prefix = ''` → element IDs like `nombre`, `phones-container`, `chips-container`
- Edit modal: `prefix = 'e-'` → element IDs like `e-nombre`, `e-phones-container`, `e-chips-container`

## Registro data schema

```json
{
  "id": 1700000000000,
  "fecha": "ISO string",
  "nombre": "NORMALIZED STRING",
  "cedula": "1234567890",
  "area": "string",
  "accesorios": ["Mouse", "Mousepad", "Ventilador"],
  "tiene_laptop": true,
  "serial_laptop": "ABC123 or 'NO TIENE'",
  "cargador_laptop": false,
  "clave": "string or 'NO TIENE'",
  "tiene_telefono": false,
  "telefonos": [{ "imei1": "", "imei2": "", "pin": "", "cargador": false }],
  "tiene_chip": false,
  "chips": [{ "numero": "0987654321", "operadora": "CLARO", "tipo": "prepago" }],
  "datos_personales": true,
  "acciones_correctivas": "string (only when datos_personales is true)",
  "observaciones": "string"
}
```

`tiene_laptop/telefono/chip` default to `true` when absent (old records). `serial_laptop` and `clave` are `'NO TIENE'` (string) when `tiene_laptop` is false.

## Collapsible sections

Equipment sections use `.equipo-section.disabled` toggled by JS. CSS does the animation via `max-height` + `opacity` transition — no JS animation needed. Sections start with `class="equipo-section disabled"` in HTML (default unchecked). Same pattern used for "Acciones correctivas" under datos personales.

CSS grid columns are defined as CSS variables:
- `--phone-cols: 1fr 1fr 1fr 112px 32px` (IMEI 1, IMEI 2, PIN, Cargador, Remove)
- `--chip-cols: 1fr 1fr 120px 32px` (Número, Operadora, Tipo, Remove)

## ⚠ Known gap: excel.js is outdated

`src/excel.js` still uses the old phone format (`serial`, `chip`, `chip2`) and does not export chips or `acciones_correctivas`. It needs updating to use `imei1`, `imei2`, add a chips block, and add the `acciones_correctivas` column.
