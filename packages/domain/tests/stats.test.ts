import { describe, expect, it } from 'vitest';
import {
  exerciseLoads,
  inPeriod,
  isStepsHabit,
  parseLocalDate,
  periodStart,
  weeklyAverages,
  weeklyRates,
  weeklyTotals,
} from '../src';

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

describe('weeklyTotals (README §13.2)', () => {
  it('sums each week and keeps stopped weeks as zero up to the last week', () => {
    const points = [
      { date: '2026-10-05', value: 30 },
      { date: '2026-10-11', value: 20.5 },
      { date: '2026-10-19', value: 10 },
    ];
    expect(weeklyTotals(points, parseLocalDate('2026-11-02'))).toEqual([
      { weekStart: '2026-10-05', total: 50.5 },
      { weekStart: '2026-10-12', total: 0 },
      { weekStart: '2026-10-19', total: 10 },
      { weekStart: '2026-10-26', total: 0 },
      { weekStart: '2026-11-02', total: 0 },
    ]);
  });

  it('has no weeks without points', () => {
    expect(weeklyTotals([], today)).toEqual([]);
  });
});

describe('exerciseLoads (README §13.2)', () => {
  it('lists the most trained exercise first and leaves out those without a load', () => {
    const bench = { exerciseId: 'b', name: 'Supino', topWeightKg: 90 };
    const squat = { exerciseId: 'a', name: 'Agachamento', topWeightKg: 100 };
    const plank = { exerciseId: 'p', name: 'Prancha', topWeightKg: null };
    expect(
      exerciseLoads([
        { date: '2026-10-01', exercises: [squat, bench, plank] },
        { date: '2026-10-03', exercises: [{ ...bench, topWeightKg: 92.5 }] },
      ]),
    ).toEqual([
      {
        exerciseId: 'b',
        name: 'Supino',
        points: [
          { date: '2026-10-01', value: 90 },
          { date: '2026-10-03', value: 92.5 },
        ],
      },
      { exerciseId: 'a', name: 'Agachamento', points: [{ date: '2026-10-01', value: 100 }] },
    ]);
  });
});

describe('isStepsHabit (README §13.2)', () => {
  it('is a quantity habit in "passos", whatever the case', () => {
    expect(isStepsHabit({ type: 'quantity', unit: 'Passos' })).toBe(true);
    expect(isStepsHabit({ type: 'quantity', unit: 'copos' })).toBe(false);
    expect(isStepsHabit({ type: 'quantity', unit: null })).toBe(false);
    expect(isStepsHabit({ type: 'duration', unit: 'passos' })).toBe(false);
  });
});
