import { describe, expect, it } from 'vitest';
import {
  csvCell,
  exportFileName,
  exportNameSlug,
  formatCsvDate,
  formatCsvDecimal,
  parseCsv,
  parseLocalDate,
  writeCsv,
} from '../src';

describe('CSV writer', () => {
  it('writes the Brazilian Excel format: BOM, `;`, CRLF', () => {
    const csv = writeCsv(['data', 'peso_kg'], [['05/10/2026', 89.8]]);
    expect(csv).toBe('﻿data;peso_kg\r\n05/10/2026;89,8\r\n');
  });

  it('formats numbers with a decimal comma and empty cells for null', () => {
    expect(csvCell(89.75)).toBe('89,75');
    expect(csvCell(92)).toBe('92');
    expect(formatCsvDecimal(2.3456, 1)).toBe('2,3');
    expect(csvCell(-1)).toBe('-1');
    expect(csvCell(null)).toBe('');
  });

  it('quotes separators, quotes and line breaks', () => {
    expect(csvCell('a;b')).toBe('"a;b"');
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(csvCell('linha\nnova')).toBe('"linha\nnova"');
  });

  it('neutralizes text that Excel would run as a formula', () => {
    expect(csvCell('=SOMA(A1)')).toBe("'=SOMA(A1)");
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('@x')).toBe("'@x");
    expect(csvCell('após viagem')).toBe('após viagem');
  });

  it('round-trips through the import reader', () => {
    const csv = writeCsv(['data', 'observacao'], [['05/10/2026', 'a; "b"\nc']]);
    const parsed = parseCsv(csv);
    expect(parsed.header).toEqual(['data', 'observacao']);
    expect(parsed.rows[0]?.cells).toEqual(['05/10/2026', 'a; "b"\nc']);
  });

  it('formats local dates as dd/mm/yyyy', () => {
    expect(formatCsvDate(parseLocalDate('2026-10-05'))).toBe('05/10/2026');
  });

  it('builds file names from the profile name', () => {
    expect(exportNameSlug('João da Silva')).toBe('joao-da-silva');
    expect(exportNameSlug('***')).toBe('perfil');
    const today = parseLocalDate('2026-11-10');
    expect(exportFileName('Ana', today, 'json')).toBe('evully-dados-ana-2026-11-10.json');
    expect(exportFileName('Ana', today, 'csv')).toBe('evully-csv-ana-2026-11-10.zip');
  });
});
