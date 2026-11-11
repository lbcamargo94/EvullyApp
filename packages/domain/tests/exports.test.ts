import { describe, expect, it } from 'vitest';
import {
  assertTransferable,
  csvCell,
  exportFileName,
  exportNameSlug,
  formatCsvDate,
  formatCsvDecimal,
  parseCsv,
  parseLocalDate,
  transferFileName,
  TRANSFER_FORMAT,
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

describe('profile transfer rules (README §14.4)', () => {
  const ok = {
    format: TRANSFER_FORMAT,
    formatVersion: 1,
    manifestSha256: 'abc',
    actualSha256: 'abc',
    schemaVersion: '0018_sleep_targets',
    appSchemaVersion: '0018_sleep_targets',
  };

  it('accepts a matching file from the same or an older schema', () => {
    expect(() => assertTransferable(ok)).not.toThrow();
    expect(() => assertTransferable({ ...ok, schemaVersion: '0017_sleep_logs' })).not.toThrow();
  });

  it('refuses other files, damaged data and newer versions', () => {
    const code = (input: typeof ok) => {
      try {
        assertTransferable(input);
        return null;
      } catch (e) {
        return (e as { code: string }).code;
      }
    };
    expect(code({ ...ok, format: 'evully-profile-export' })).toBe('transfer.invalid');
    expect(code({ ...ok, actualSha256: 'def' })).toBe('transfer.corrupt');
    expect(code({ ...ok, schemaVersion: '0019_future' })).toBe('transfer.newer');
    expect(code({ ...ok, formatVersion: 2 })).toBe('transfer.newer');
  });

  it('names the file after the profile', () => {
    expect(transferFileName('Ana Lú', parseLocalDate('2026-11-10'))).toBe(
      'evully-perfil-ana-lu-2026-11-10.zip',
    );
  });
});
