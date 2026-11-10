import type { LocalDate } from '../local-date';

/** A CSV cell: text as is, numbers with a decimal comma, null as an empty cell. */
export type CsvValue = string | number | null;

const UTF8_BOM = '﻿';
const DIACRITICS = /[̀-ͯ]/g;
const NEEDS_QUOTES = /[;"\r\n]/;
/** Excel runs cells starting with these as formulas (CSV injection). */
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Writes a CSV in the Brazilian Excel format used by the import templates
 * (README §8.8, §14.3): `;` separator, decimal comma, UTF-8 with BOM, CRLF.
 */
export function writeCsv(
  header: readonly string[],
  rows: readonly (readonly CsvValue[])[],
): string {
  const lines = [header, ...rows].map((cells) => cells.map(csvCell).join(';'));
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
}

/** One cell, quoted when needed; text that Excel would run as a formula gets a leading `'`. */
export function csvCell(value: CsvValue): string {
  if (value === null) return '';
  if (typeof value === 'number') return formatCsvDecimal(value);
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** `89.75` → `89,75`; at most `decimals` places, no thousands separator. */
export function formatCsvDecimal(value: number, decimals = 2): string {
  const factor = 10 ** decimals;
  return String(Math.round(value * factor) / factor).replace('.', ',');
}

/** `2026-10-05` → `05/10/2026`, the format the import reads back. */
export function formatCsvDate(date: LocalDate | string): string {
  const [year, month, day] = date.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/** File name part from a profile name: `João Silva` → `joao-silva`. */
export function exportNameSlug(profileName: string): string {
  const slug = profileName
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.slice(0, 40).replace(/-+$/, '') || 'perfil';
}

/** `evully-dados-joao-2026-11-10.json` or `evully-csv-joao-2026-11-10.zip` (README §14.3). */
export function exportFileName(
  profileName: string,
  today: LocalDate,
  format: 'json' | 'csv',
): string {
  const slug = exportNameSlug(profileName);
  return format === 'json'
    ? `evully-dados-${slug}-${today}.json`
    : `evully-csv-${slug}-${today}.zip`;
}
