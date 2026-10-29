import { describe, expect, it } from 'vitest';
import { inPeriod, parseLocalDate, periodStart, weeklyAverages, weeklyRates } from '../src';

const today = parseLocalDate('2026-10-28');
const project = parseLocalDate('2026-09-01');

describe('periodStart (README §13.2)', () => {
  it('counts 30 and 90 days ending today, the project start, or no bound', () => {
    expect(periodStart('days30', today, project)).toBe('2026-09-29');
    expect(periodStart('days90', today, project)).toBe('2026-07-31');
    expect(periodStart('project', today, project)).toBe('2026-09-01');
    expect(periodStart('project', today, null)).toBeNull();
    expect(periodStart('all', today, project)).toBeNull();
  });
});

describe('inPeriod', () => {
  const points = [
    { date: '2026-09-28', value: 1 },
    { date: '2026-09-29', value: 2 },
    { date: '2026-10-28', value: 3 },
  ];

  it('keeps points on or after the start', () => {
    expect(inPeriod(points, parseLocalDate('2026-09-29')).map((p) => p.value)).toEqual([2, 3]);
    expect(inPeriod(points, null)).toHaveLength(3);
  });
});

describe('weeklyAverages and weeklyRates', () => {
  // Mondays: 2026-10-12, 2026-10-19, 2026-10-26.
  const points = [
    { date: '2026-10-25', value: 90 }, // Sunday, week of 10-19
    { date: '2026-10-19', value: 91 },
    { date: '2026-10-12', value: 92 },
    { date: '2026-10-14', value: 91.5 },
    { date: '2026-10-27', value: 89.4 },
  ];

  it('averages each ISO week, oldest first', () => {
    expect(weeklyAverages(points)).toEqual([
      { weekStart: '2026-10-12', average: 91.75, days: 2 },
      { weekStart: '2026-10-19', average: 90.5, days: 2 },
      { weekStart: '2026-10-26', average: 89.4, days: 1 },
    ]);
    expect(weeklyAverages([])).toEqual([]);
  });

  it('measures the change per week between consecutive averages', () => {
    expect(weeklyRates(weeklyAverages(points))).toEqual([
      { weekStart: '2026-10-19', ratePerWeek: -1.25 },
      { weekStart: '2026-10-26', ratePerWeek: -1.1 },
    ]);
  });

  it('spreads a gap of several weeks over its length', () => {
    const weeks = weeklyAverages([
      { date: '2026-10-05', value: 92 },
      { date: '2026-10-26', value: 89 },
    ]);
    expect(weeklyRates(weeks)).toEqual([{ weekStart: '2026-10-26', ratePerWeek: -1 }]);
  });
});
