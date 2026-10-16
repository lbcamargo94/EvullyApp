import { DomainError } from '../errors';
import type { LocalDate } from '../local-date';
import { normalizeMeasurementDraft } from '../measurements/measurement';
import { normalizeWeightDraft } from '../weights/weight';
import { parseCsv, parseCsvDate, parseCsvDecimal, parseCsvTime, type CsvRow } from './csv';

/** Limit that keeps a wrong file from freezing the app. */
export const IMPORT_MAX_ROWS = 5000;
/** Rows without a time are recorded at noon (README §8.8). */
export const IMPORT_DEFAULT_TIME = '12:00';

const UTF8_BOM = '\uFEFF';

export interface RowIssue {
  line: number;
  code: string;
}

export interface ImportPlan<T> {
  /** File-level problem; when set nothing can be imported. */
  fileError: string | null;
  ready: (T & { line: number })[];
  duplicates: (T & { line: number })[];
  errors: RowIssue[];
}

/** A row either becomes a value or an error code. */
type RowResult<T> = { ok: true; value: T } | { ok: false; code: string };

const failed = (code: string): RowResult<never> => ({ ok: false, code });
const codeOf = (error: unknown) =>
  error instanceof DomainError ? error.code : 'import.invalid_row';

/** Shared loop: parse each row and drop duplicates (also rows repeated inside the file). */
function buildPlan<T>(
  rows: readonly CsvRow[],
  parseRow: (row: CsvRow) => RowResult<T>,
  keyOf: (value: T) => string,
  existingKeys: Iterable<string>,
): ImportPlan<T> {
  const seen = new Set(existingKeys);
  const plan: ImportPlan<T> = { fileError: null, ready: [], duplicates: [], errors: [] };
  for (const row of rows) {
    const result = parseRow(row);
    if (!result.ok) {
      plan.errors.push({ line: row.line, code: result.code });
      continue;
    }
    const key = keyOf(result.value);
    const target = seen.has(key) ? plan.duplicates : plan.ready;
    seen.add(key);
    target.push({ line: row.line, ...result.value });
  }
  return plan;
}

function fileCheck(rowCount: number, hasDateColumn: boolean): string | null {
  if (rowCount === 0) return 'import.empty_file';
  if (rowCount > IMPORT_MAX_ROWS) return 'import.too_many_rows';
  if (!hasDateColumn) return 'import.missing_date_column';
  return null;
}

const rejected = <T>(code: string): ImportPlan<T> => ({
  fileError: code,
  ready: [],
  duplicates: [],
  errors: [],
});

// ---------------------------------------------------------------- weights

export interface WeightImportRow {
  measuredOn: LocalDate;
  time: string;
  weightKg: number;
  notes: string | null;
}

interface WeightColumns {
  date: number;
  time: number;
  weight: number;
  notes: number;
}

/**
 * Plans a `pesos.csv` import (README §8.8): columns `data`, `hora` (optional),
 * `peso_kg`, `observacao` (optional). Rows equal to an existing weighing (same
 * date and weight) are duplicates and ignored.
 */
export function planWeightImport(
  text: string,
  today: LocalDate,
  existing: readonly { measuredOn: string; weightKg: number }[],
): ImportPlan<WeightImportRow> {
  const csv = parseCsv(text);
  const cols: WeightColumns = {
    date: csv.header.indexOf('data'),
    time: csv.header.indexOf('hora'),
    weight: csv.header.indexOf('peso_kg'),
    notes: csv.header.indexOf('observacao'),
  };
  const problem = fileCheck(csv.rows.length, cols.date >= 0);
  if (problem) return rejected(problem);
  if (cols.weight < 0) return rejected('import.missing_weight_column');

  const key = (date: string, kg: number) => `${date}|${kg.toFixed(2)}`;
  return buildPlan(
    csv.rows,
    ({ cells }) => parseWeightRow(cells, cols, today),
    (row) => key(row.measuredOn, row.weightKg),
    existing.map((e) => key(e.measuredOn, e.weightKg)),
  );
}

function parseWeightRow(
  cells: readonly string[],
  cols: WeightColumns,
  today: LocalDate,
): RowResult<WeightImportRow> {
  const cell = (i: number) => (i >= 0 ? (cells[i] ?? '') : '');
  const measuredOn = parseCsvDate(cell(cols.date));
  if (!measuredOn) return failed('import.invalid_date');
  const time = parseCsvTime(cell(cols.time));
  if (time === null) return failed('import.invalid_time');
  const weightKg = parseCsvDecimal(cell(cols.weight));
  if (weightKg === null) return failed('import.invalid_number');
  try {
    const values = normalizeWeightDraft(
      { measuredOn, measuredAt: '', weightKg, notes: cell(cols.notes) || null },
      today,
    );
    const row = {
      measuredOn,
      time: time ?? IMPORT_DEFAULT_TIME,
      weightKg: values.weightKg,
      notes: values.notes,
    };
    return { ok: true, value: row };
  } catch (error) {
    return failed(codeOf(error));
  }
}

// ----------------------------------------------------------- measurements

export interface CatalogType {
  id: string;
  code: string;
  csvName: string;
}

interface MeasurementValue {
  measurementTypeId: string;
  valueCm: number;
}

export interface MeasurementImportRow {
  measuredOn: LocalDate;
  notes: string | null;
  values: MeasurementValue[];
}

interface MeasurementLayout {
  dateCol: number;
  notesCol: number;
  columns: { index: number; typeId: string }[];
}

/**
 * Plans a `medidas.csv` import (README §8.8): column `data`, optional
 * `observacao`, and one column per measurement named by its `csv_name` or
 * `code`. A row equal to an existing session (same date and values) is a
 * duplicate. `typeIds` lists the measurement types used by the ready rows.
 */
export function planMeasurementImport(
  text: string,
  today: LocalDate,
  catalog: readonly CatalogType[],
  existing: readonly { measuredOn: string; values: MeasurementValue[] }[],
): ImportPlan<MeasurementImportRow> & { typeIds: string[] } {
  const csv = parseCsv(text);
  const dateCol = csv.header.indexOf('data');
  const notesCol = csv.header.indexOf('observacao');
  const problem = fileCheck(csv.rows.length, dateCol >= 0);
  if (problem) return { ...rejected(problem), typeIds: [] };
  const columns = measurementColumns(csv.header, catalog, [dateCol, notesCol]);
  if (typeof columns === 'string') return { ...rejected(columns), typeIds: [] };

  const layout = { dateCol, notesCol, columns };
  const plan = buildPlan(
    csv.rows,
    ({ cells }) => parseMeasurementRow(cells, layout, today),
    (row) => sessionKey(row.measuredOn, row.values),
    existing.map((s) => sessionKey(s.measuredOn, s.values)),
  );
  const used = plan.ready.flatMap((r) => r.values.map((v) => v.measurementTypeId));
  return { ...plan, typeIds: [...new Set(used)] };
}

/** Maps each measurement column to a catalog type, or returns a file-level error code. */
function measurementColumns(
  header: readonly string[],
  catalog: readonly CatalogType[],
  skip: readonly number[],
): MeasurementLayout['columns'] | string {
  const columns: MeasurementLayout['columns'] = [];
  for (const [index, name] of header.entries()) {
    if (skip.includes(index) || name === 'hora') continue;
    const type = catalog.find((t) => t.csvName === name || t.code === name);
    if (!type) return 'import.unknown_column';
    columns.push({ index, typeId: type.id });
  }
  return columns.length ? columns : 'import.no_measurement_columns';
}

function parseMeasurementRow(
  cells: readonly string[],
  layout: MeasurementLayout,
  today: LocalDate,
): RowResult<MeasurementImportRow> {
  const measuredOn = parseCsvDate(cells[layout.dateCol] ?? '');
  if (!measuredOn) return failed('import.invalid_date');
  const values: MeasurementValue[] = [];
  for (const { index, typeId } of layout.columns) {
    const text = cells[index]?.trim() ?? '';
    if (!text) continue;
    const valueCm = parseCsvDecimal(text);
    if (valueCm === null) return failed('import.invalid_number');
    values.push({ measurementTypeId: typeId, valueCm });
  }
  try {
    const notes = layout.notesCol >= 0 ? cells[layout.notesCol] || null : null;
    const normalized = normalizeMeasurementDraft(
      { measuredOn, measuredAt: '', values, notes },
      today,
    );
    return {
      ok: true,
      value: { measuredOn, notes: normalized.notes, values: [...normalized.values] },
    };
  } catch (error) {
    return failed(codeOf(error));
  }
}

function sessionKey(date: string, values: readonly MeasurementValue[]): string {
  const parts = [...values]
    .sort((a, b) => a.measurementTypeId.localeCompare(b.measurementTypeId))
    .map((v) => `${v.measurementTypeId}=${v.valueCm.toFixed(1)}`);
  return `${date}|${parts.join(',')}`;
}

// -------------------------------------------------------------- templates

/** Example files offered by "Baixar modelo" (README §8.8), in the Brazilian Excel format. */
export function weightImportTemplate(): string {
  const rows = [
    'data;hora;peso_kg;observacao',
    '05/10/2026;07:10;92,0;',
    '06/10/2026;;91,6;após viagem',
  ];
  return `${UTF8_BOM}${rows.join('\r\n')}\r\n`;
}

export function measurementImportTemplate(csvNames: readonly string[]): string {
  const names = csvNames.length ? csvNames : ['cintura'];
  const rows = [
    `data;${names.join(';')};observacao`,
    `05/10/2026;${names.map(() => '').join(';')};`,
  ];
  return `${UTF8_BOM}${rows.join('\r\n')}\r\n`;
}
