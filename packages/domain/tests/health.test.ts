import { describe, expect, it } from 'vitest';
import {
  analyteByCode,
  checkHealthPdf,
  HEALTH_PDF_MAX_BYTES,
  healthDocumentFileName,
  ANALYTES,
  normalizeHealthExam,
  parseLocalDate,
  resultFlag,
  ValidationError,
  type HealthExamDraft,
  type HealthResultDraft,
} from '../src';

const today = parseLocalDate('2026-11-26');
const result = (over: Partial<HealthResultDraft> = {}): HealthResultDraft => ({
  analyteCode: 'ferritin',
  analyteName: '',
  value: 80,
  unit: 'ng/mL',
  referenceMin: 30,
  referenceMax: 400,
  referenceText: null,
  ...over,
});
const exam = (over: Partial<HealthExamDraft> = {}): HealthExamDraft => ({
  collectedOn: '2026-11-20',
  laboratory: '  Lab Centro ',
  notes: '   ',
  results: [result()],
  ...over,
});
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof ValidationError ? e.code : 'other';
  }
  return null;
};

describe('health exams (README §24)', () => {
  it('normalizes an exam and fills the name from the catalog', () => {
    expect(normalizeHealthExam(exam(), today)).toEqual({
      collectedOn: '2026-11-20',
      laboratory: 'Lab Centro',
      notes: null,
      results: [{ ...result(), analyteName: 'Ferritina' }],
    });
    const typed = normalizeHealthExam(
      exam({
        results: [result({ analyteCode: null, analyteName: ' Homocisteína ', unit: 'µmol/L' })],
      }),
      today,
    );
    expect(typed.results[0]).toMatchObject({ analyteCode: null, analyteName: 'Homocisteína' });
  });

  it('refuses what it cannot store as typed', () => {
    expect(code(() => normalizeHealthExam(exam({ collectedOn: '2026-11-27' }), today))).toBe(
      'health.date_in_future',
    );
    expect(code(() => normalizeHealthExam(exam({ results: [] }), today))).toBe(
      'health.results_required',
    );
    expect(
      code(() => normalizeHealthExam(exam({ results: [result({ analyteCode: 'x' })] }), today)),
    ).toBe('health.unknown_analyte');
    expect(
      code(() => normalizeHealthExam(exam({ results: [result({ analyteCode: null })] }), today)),
    ).toBe('health.analyte_required');
    expect(code(() => normalizeHealthExam(exam({ results: [result({ unit: ' ' })] }), today))).toBe(
      'health.unit_required',
    );
    expect(
      code(() =>
        normalizeHealthExam(
          exam({ results: [result({ referenceMin: 10, referenceMax: 5 })] }),
          today,
        ),
      ),
    ).toBe('health.reference_order');
  });

  it('flags a value only against the laboratory range', () => {
    expect(resultFlag(result({ value: 20 }))).toBe('below');
    expect(resultFlag(result({ value: 30 }))).toBe('within');
    expect(resultFlag(result({ value: 400 }))).toBe('within');
    expect(resultFlag(result({ value: 401 }))).toBe('above');
    expect(resultFlag(result({ referenceMin: null, value: 1 }))).toBe('within');
    expect(resultFlag(result({ referenceMax: null, value: 9999 }))).toBe('within');
    expect(resultFlag(result({ referenceMin: null, referenceMax: null }))).toBe('unknown');
  });

  it('keeps a catalog with unique codes and no reference ranges', () => {
    expect(new Set(ANALYTES.map((a) => a.code)).size).toBe(ANALYTES.length);
    expect(ANALYTES.length).toBeGreaterThanOrEqual(30);
    expect(analyteByCode('vitamin_d')).toMatchObject({ name: 'Vitamina D (25-OH)' });
    expect(analyteByCode('nope')).toBeNull();
  });
});

describe('health documents (README §24.2)', () => {
  const pdf = (size = 20) => {
    const bytes = new Uint8Array(size);
    bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    return bytes;
  };
  const code = (bytes: Uint8Array) => {
    try {
      checkHealthPdf(bytes);
      return null;
    } catch (e) {
      return e instanceof ValidationError ? e.code : 'other';
    }
  };

  it('accepts a PDF up to 10 MB and refuses anything else', () => {
    expect(code(pdf())).toBeNull();
    expect(code(pdf(HEALTH_PDF_MAX_BYTES))).toBeNull();
    expect(code(pdf(HEALTH_PDF_MAX_BYTES + 1))).toBe('health.document_too_large');
    expect(code(new Uint8Array())).toBe('health.document_empty');
    expect(code(Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x20]))).toBe('health.document_not_pdf');
  });

  it('keeps only a safe file name ending in .pdf', () => {
    expect(healthDocumentFileName('C:\\Users\\x\\Laudo março.pdf')).toBe('Laudo março.pdf');
    expect(healthDocumentFileName('../a:b?.PDF')).toBe('a_b_.PDF');
    expect(healthDocumentFileName('laudo')).toBe('laudo.pdf');
    expect(healthDocumentFileName('')).toBe('exame.pdf');
  });
});
