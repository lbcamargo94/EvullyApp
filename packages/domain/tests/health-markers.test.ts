import { describe, expect, it } from 'vitest';
import {
  ANALYTES,
  compareExams,
  markerHistories,
  markerKey,
  markerLevel,
  markerTrend,
  type MarkerExamInput,
  type MarkerResultInput,
} from '../src';

const ferritin = (value: number, over: Partial<MarkerResultInput> = {}): MarkerResultInput => ({
  analyteCode: 'ferritin',
  analyteName: 'Ferritina',
  value,
  unit: 'ng/mL',
  referenceMin: 30,
  referenceMax: 400,
  ...over,
});
const exam = (id: string, collectedOn: string, results: MarkerResultInput[]): MarkerExamInput => ({
  id,
  collectedOn,
  results,
});
const pointsOf = (exams: MarkerExamInput[]) => markerHistories(exams)[0]?.points ?? [];

describe('marker catalog (README §24.3)', () => {
  it('has one neutral sentence for every marker', () => {
    for (const a of ANALYTES) expect(a.about.length).toBeGreaterThan(20);
  });
});

describe('markerHistories', () => {
  it('joins coded results and typed names ignoring case and accents, oldest first', () => {
    const exams = [
      exam('b', '2026-10-01', [ferritin(25)]),
      exam('a', '2026-06-01', [ferritin(40, { analyteCode: null, analyteName: ' ferritína ' })]),
      exam('c', '2026-11-01', [
        { ...ferritin(5), analyteCode: null, analyteName: 'Lipase', unit: 'U/L' },
        { ...ferritin(7), analyteCode: null, analyteName: 'LIPASE', unit: 'U/L' },
      ]),
    ];
    const histories = markerHistories(exams);
    expect(histories.map((h) => h.name)).toEqual(['Ferritina', 'Lipase']);
    expect(histories[0]?.points.map((p) => p.collectedOn)).toEqual(['2026-06-01', '2026-10-01']);
    expect(histories[0]?.analyteCode).toBe('ferritin');
    // Only the first result of a marker counts within one exam.
    expect(histories[1]?.points.map((p) => p.value)).toEqual([5]);
    expect(markerKey({ analyteCode: null, analyteName: 'Lipase ' })).toBe('name:lipase');
  });
});

describe('markerTrend', () => {
  it('compares the last two values only in the same unit', () => {
    expect(markerTrend(pointsOf([exam('a', '2026-01-01', [ferritin(40)])]))).toBe('single');
    const two = (a: number, b: number, unit = 'ng/mL') =>
      markerTrend(
        pointsOf([
          exam('a', '2026-01-01', [ferritin(a)]),
          exam('b', '2026-02-01', [ferritin(b, { unit })]),
        ]),
      );
    expect(two(40, 50)).toBe('up');
    expect(two(40, 30)).toBe('down');
    expect(two(40, 40)).toBe('same');
    expect(two(40, 50, 'NG/ML')).toBe('up');
    expect(two(40, 50, 'µg/L')).toBe('unit_changed');
  });
});

describe('markerLevel (README §24.4)', () => {
  const level = (...values: number[]) =>
    markerLevel(pointsOf(values.map((v, i) => exam(`e${i}`, `2026-0${i + 1}-01`, [ferritin(v)]))));

  it('is informative within the range or without one', () => {
    expect(level(80)).toBe('informative');
    expect(level(20, 80)).toBe('informative');
    expect(
      markerLevel(
        pointsOf([
          exam('a', '2026-01-01', [ferritin(5, { referenceMin: null, referenceMax: null })]),
        ]),
      ),
    ).toBe('informative');
  });

  it('asks for attention once and recommends a professional for two in a row on one side', () => {
    expect(level(20)).toBe('attention');
    expect(level(80, 20)).toBe('attention');
    expect(level(500, 20)).toBe('attention');
    expect(level(25, 20)).toBe('professional');
    expect(level(500, 450)).toBe('professional');
  });
});

describe('compareExams', () => {
  it('puts the older exam first and gives a difference only in the same unit', () => {
    const older = exam('a', '2026-01-01', [
      ferritin(22),
      { ...ferritin(18), analyteCode: 'vitamin_d', analyteName: 'Vitamina D (25-OH)' },
    ]);
    const newer = exam('b', '2026-03-01', [
      ferritin(30.1),
      {
        ...ferritin(70),
        analyteCode: 'vitamin_d',
        analyteName: 'Vitamina D (25-OH)',
        unit: 'nmol/L',
      },
      { ...ferritin(14), analyteCode: 'hemoglobin', analyteName: 'Hemoglobina', unit: 'g/dL' },
    ]);
    const rows = compareExams(newer, older);
    expect(rows.map((r) => r.name)).toEqual(['Ferritina', 'Hemoglobina', 'Vitamina D (25-OH)']);
    expect(rows[0]?.difference).toBe(8.1);
    expect(rows[1]).toMatchObject({ before: null, difference: null });
    expect(rows[2]).toMatchObject({ difference: null });
    expect(rows[2]?.before?.value).toBe(18);
  });
});
