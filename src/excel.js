const ExcelJS = require('exceljs');

// Columnas fijas antes y después del bloque de teléfonos.
const BASE_COLUMNS = [
  { header: 'Fecha', key: 'fecha', width: 20 },
  { header: 'Nombre', key: 'nombre', width: 28 },
  { header: 'Cédula', key: 'cedula', width: 14 },
  { header: 'Área', key: 'area', width: 14 },
  { header: 'Accesorios', key: 'accesorios', width: 30 },
  { header: 'Serial laptop', key: 'serial_laptop', width: 18 },
  { header: 'Cargador laptop', key: 'cargador_laptop', width: 14 },
  { header: 'Clave', key: 'clave', width: 16 },
];

const TAIL_COLUMNS = [
  { header: 'Datos personales', key: 'datos_personales', width: 16 },
  { header: 'Observaciones', key: 'observaciones', width: 40 },
];

const PHONE_STYLE = { alignment: { wrapText: true, vertical: 'top' } };

function phoneCell(t) {
  return [
    `Serial: ${t.serial || '-'}`,
    `Chip: ${t.chip || '-'}`,
    `Chip 2: ${t.chip2 || '-'}`,
    `PIN: ${t.pin || '-'}`,
    `Cargador: ${t.cargador ? 'Sí' : 'No'}`,
  ].join('\n');
}

function baseRow(r) {
  return {
    fecha: r.fecha ? new Date(r.fecha).toLocaleString('es-EC') : '',
    nombre: r.nombre || '',
    cedula: r.cedula || '',
    area: r.area || '',
    accesorios: (r.accesorios || []).join(', '),
    serial_laptop: r.serial_laptop || '',
    cargador_laptop: r.cargador_laptop ? 'Sí' : 'No',
    clave: r.clave || '',
    datos_personales: r.datos_personales ? 'Sí' : 'No',
    observaciones: r.observaciones || '',
  };
}

// Construye un workbook .xlsx; cada teléfono va en su propia columna/celda.
async function buildWorkbook(registros) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Registros');

  // Cuántas columnas de teléfono hacen falta = máximo de teléfonos en un registro.
  const maxPhones = registros.reduce((m, r) => Math.max(m, (r.telefonos || []).length), 0);

  const phoneColumns = [];
  for (let i = 1; i <= maxPhones; i++) {
    phoneColumns.push({ header: `Teléfono ${i}`, key: `tel${i}`, width: 26, style: PHONE_STYLE });
  }

  // Orden: base → teléfonos → cola
  ws.columns = [...BASE_COLUMNS, ...phoneColumns, ...TAIL_COLUMNS];

  registros.forEach((r) => {
    const row = baseRow(r);
    (r.telefonos || []).forEach((t, i) => { row[`tel${i + 1}`] = phoneCell(t); });
    ws.addRow(row);
  });

  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: 'middle' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };

  return wb;
}

module.exports = { buildWorkbook };
