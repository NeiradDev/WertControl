const ExcelJS = require('exceljs');

const BASE_COLUMNS = [
  { header: 'Fecha',           key: 'fecha',           width: 20 },
  { header: 'Nombre',          key: 'nombre',          width: 28 },
  { header: 'Cédula',          key: 'cedula',          width: 14 },
  { header: 'Área',            key: 'area',            width: 16 },
  { header: 'Accesorios',      key: 'accesorios',      width: 28 },
  { header: 'Serial laptop',   key: 'serial_laptop',   width: 18 },
  { header: 'Cargador laptop', key: 'cargador_laptop', width: 14 },
  { header: 'Clave',           key: 'clave',           width: 16 },
];

const TAIL_COLUMNS = [
  { header: 'Datos personales',      key: 'datos_personales',      width: 16 },
  { header: 'Acciones correctivas',  key: 'acciones_correctivas',  width: 40 },
  { header: 'Observaciones',         key: 'observaciones',         width: 40 },
];

const WRAP = { alignment: { wrapText: true, vertical: 'top' } };

function phoneCell(t) {
  return [
    `IMEI 1: ${t.imei1 || t.serial || '-'}`,
    `IMEI 2: ${t.imei2 || '-'}`,
    `PIN: ${t.pin || '-'}`,
    `Cargador: ${t.cargador ? 'Sí' : 'No'}`,
  ].join('\n');
}

function chipCell(c) {
  return [
    `N°: ${c.numero || '-'}`,
    `Operadora: ${c.operadora || '-'}`,
    `Tipo: ${c.tipo || '-'}`,
  ].join('\n');
}

function baseRow(r) {
  const noTiene = r.tiene_laptop === false;
  return {
    fecha:             r.fecha ? new Date(r.fecha).toLocaleString('es-EC') : '',
    nombre:            r.nombre || '',
    cedula:            r.cedula || '',
    area:              r.area || '',
    accesorios:        (r.accesorios || []).join(', '),
    serial_laptop:     noTiene ? 'NO TIENE' : (r.serial_laptop || ''),
    cargador_laptop:   noTiene ? '-' : (r.cargador_laptop ? 'Sí' : 'No'),
    clave:             noTiene ? 'NO TIENE' : (r.clave || ''),
    datos_personales:  r.datos_personales ? 'Sí' : 'No',
    acciones_correctivas: r.acciones_correctivas || '',
    observaciones:     r.observaciones || '',
  };
}

async function buildWorkbook(registros) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Registros');

  const maxPhones = registros.reduce((m, r) => Math.max(m, (r.telefonos || []).length), 0);
  const maxChips  = registros.reduce((m, r) => Math.max(m, (r.chips  || []).length),  0);

  const phoneCols = Array.from({ length: maxPhones }, (_, i) => ({
    header: `Teléfono ${i + 1}`, key: `tel${i + 1}`, width: 28, style: WRAP,
  }));

  const chipCols = Array.from({ length: maxChips }, (_, i) => ({
    header: `Chip ${i + 1}`, key: `chip${i + 1}`, width: 24, style: WRAP,
  }));

  ws.columns = [...BASE_COLUMNS, ...phoneCols, ...chipCols, ...TAIL_COLUMNS];

  registros.forEach((r) => {
    const row = baseRow(r);

    if (r.tiene_telefono === false) {
      row.tel1 = 'NO TIENE';
    } else {
      (r.telefonos || []).forEach((t, i) => { row[`tel${i + 1}`] = phoneCell(t); });
    }

    if (r.tiene_chip === false) {
      row.chip1 = 'NO TIENE';
    } else {
      (r.chips || []).forEach((c, i) => { row[`chip${i + 1}`] = chipCell(c); });
    }

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
