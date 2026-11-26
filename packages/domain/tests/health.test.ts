import { describe, expect, it } from 'vitest';
import {
  analyteByCode,
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
