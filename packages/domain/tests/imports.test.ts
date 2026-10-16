import { describe, expect, it } from 'vitest';
import {
  measurementImportTemplate,
  parseCsv,
  parseCsvDate,
  parseCsvDecimal,
  parseCsvTime,
  parseLocalDate,
  planMeasurementImport,
  planWeightImport,
  weightImportTemplate,
} from '../src';

const today = parseLocalDate('2026-10-16');

describe('parseCsv', () => {
  it('detects ";" and normalizes headers', () => {
    const csv = parseCsv('\uFEFFData;Peso_KG;Observação\r\n05/10/2026;92,0;"tem ; ponto"\r\n\r\n');
    expect(csv.delimiter).toBe(';');
    expect(csv.header).toEqual(['data', 'peso_kg', 'observacao']);
    expect(csv.rows).toEqual([{ line: 2, cells: ['05/10/2026', '92,0', 'tem ; ponto'] }]);
  });

  it('reads "," files with quoted fields and escaped quotes', () => {
    const csv = parseCsv('data,peso_kg,observacao\n2026-10-05,92.0,"disse ""oi"""\n');
    expect(csv.delimiter).toBe(',');
    expect(csv.rows[0]?.cells).toEqual(['2026-10-05', '92.0', 'disse "oi"']);
  });

  it('keeps line numbers after blank lines', () => {
    const csv = parseCsv('data;peso_kg\n\n05/10/2026;92\n06/10/2026;91\n');
    expect(csv.rows.map((r) => r.line)).toEqual([3, 4]);
  });
});

describe('cell parsers', () => {
  it.each([
    ['89,8', 89.8],
    ['89.8', 89.8],
    [' 92 ', 92],
    ['8x', null],
    ['', null],
    ['-1', null],
  ])('decimal %j → %j', (text, value) => {
    expect(parseCsvDecimal(text)).toBe(value);
  });

  it.each([
    ['05/10/2026', '2026-10-05'],
    ['2026-10-05', '2026-10-05'],
    ['31/09/2026', null],
    ['5/10/2026', null],
  ])('date %j → %j', (text, value) => {
    expect(parseCsvDate(text)).toBe(value);
  });

  it.each([
    ['7:05', '07:05'],
    ['', undefined],
    ['24:00', null],
    ['ab', null],
  ])('time %j → %j', (text, value) => {
    expect(parseCsvTime(text)).toBe(value);
  });
});

describe('planWeightImport', () => {
  const file = [
    'data;hora;peso_kg;observacao',
    '05/10/2026;07:10;92,0;', // duplicate of an existing weighing
    '06/10/2026;;91,6;após viagem', // no time → noon
    '07/10/2026;07:05;91,8;',
    '08/10/2026;07:30;9,13;', // out of range
    '31/09/2026;07:00;91,5;', // invalid date
    '17/10/2026;07:00;91,0;', // future
    '09/10/2026;07:00;9x;', // not a number
    '09/10/2026;07:00;91,5;',
    '09/10/2026;07:00;91,5;', // repeated inside the file
  ].join('\n');

  it('classifies rows as ready, duplicate or error, with line numbers', () => {
    const plan = planWeightImport(file, today, [{ measuredOn: '2026-10-05', weightKg: 92 }]);
    expect(plan.fileError).toBeNull();
    expect(plan.ready.map((r) => [r.line, r.measuredOn, r.time, r.weightKg, r.notes])).toEqual([
      [3, '2026-10-06', '12:00', 91.6, 'após viagem'],
      [4, '2026-10-07', '07:05', 91.8, null],
      [9, '2026-10-09', '07:00', 91.5, null],
    ]);
    expect(plan.duplicates.map((r) => r.line)).toEqual([2, 10]);
    expect(plan.errors).toEqual([
      { line: 5, code: 'weight.out_of_range' },
      { line: 6, code: 'import.invalid_date' },
      { line: 7, code: 'weight.date_in_future' },
      { line: 8, code: 'import.invalid_number' },
    ]);
  });

  it.each([
    ['', 'import.empty_file'],
    ['data;peso_kg\n', 'import.empty_file'],
    ['peso_kg\n92', 'import.missing_date_column'],
    ['data\n05/10/2026', 'import.missing_weight_column'],
  ])('rejects the whole file %j', (text, code) => {
    expect(planWeightImport(text, today, []).fileError).toBe(code);
  });

  it('reads the template it offers', () => {
    expect(planWeightImport(weightImportTemplate(), today, []).ready).toHaveLength(2);
  });
});

describe('planMeasurementImport', () => {
  const catalog = [
    { id: 'w', code: 'waist', csvName: 'cintura' },
    { id: 'a', code: 'abdomen', csvName: 'abdomen' },
    { id: 'h', code: 'hips', csvName: 'quadril' },
  ];

  it('maps columns by csv name or code and lists the types used', () => {
    const plan = planMeasurementImport(
      'data;cintura;hips;observacao\n05/10/2026;96;109;\n12/10/2026;94,6;;\n13/10/2026;;;\n',
      today,
      catalog,
      [
        {
          measuredOn: '2026-10-05',
          values: [
            { measurementTypeId: 'h', valueCm: 109 },
            { measurementTypeId: 'w', valueCm: 96 },
          ],
        },
      ],
    );
    expect(plan.duplicates.map((r) => r.line)).toEqual([2]);
    expect(plan.ready).toEqual([
      {
        line: 3,
        measuredOn: '2026-10-12',
        notes: null,
        values: [{ measurementTypeId: 'w', valueCm: 94.6 }],
      },
    ]);
    expect(plan.errors).toEqual([{ line: 4, code: 'measurement.empty' }]);
    expect(plan.typeIds).toEqual(['w']);
  });

  it.each([
    ['data;pescoco\n05/10/2026;40', 'import.unknown_column'],
    ['data;observacao\n05/10/2026;x', 'import.no_measurement_columns'],
    ['cintura\n96', 'import.missing_date_column'],
  ])('rejects the whole file %j', (text, code) => {
    expect(planMeasurementImport(text, today, catalog, []).fileError).toBe(code);
  });

  it('builds a template with the given columns', () => {
    expect(measurementImportTemplate(['cintura', 'quadril'])).toBe(
      '\uFEFFdata;cintura;quadril;observacao\r\n05/10/2026;;;\r\n',
    );
  });
});
