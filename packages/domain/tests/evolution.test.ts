import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  evolutionSummary,
  isEmptySummary,
  parseLocalDate,
  type EvolutionInput,
  type StatPoint,
} from '../src';

const today = parseLocalDate('2026-11-04');
const ago = (days: number) => addDaysToLocalDate(today, -days);
const point = (daysAgo: number, value: number): StatPoint => ({ date: ago(daysAgo), value });

const empty: EvolutionInput = {
  weights: [],
  waist: [],
  workouts: [],
  plannedWeekdays: [],
  protein: [],
  sleep: [],
};

describe('evolutionSummary (README §13.3)', () => {
  it('has no line without records', () => {
    const summary = evolutionSummary(empty, today);
    expect(isEmptySummary(summary)).toBe(true);
  });

  it('compares the mean weight of the last 7 days with the 7 before', () => {
    const weights = [
      point(0, 89),
      point(2, 89.5),
      point(6, 90),
      point(7, 90),
      point(9, 90.5),
      point(13, 90.2),
      point(14, 99), // outside the window
    ];
    expect(evolutionSummary({ ...empty, weights }, today).weightRatePerWeek).toBe(-0.73);
  });

  it('needs 3 weighings in each week', () => {
    const weights = [point(0, 89), point(2, 89.5), point(7, 90), point(9, 90.5), point(13, 90)];
    expect(evolutionSummary({ ...empty, weights }, today).weightRatePerWeek).toBeNull();
  });

  it('measures the waist against the last measurement before the window', () => {
    const waist = [point(30, 95), point(16, 94.6), point(2, 93.4)];
    expect(evolutionSummary({ ...empty, waist }, today).waistChangeCm).toBe(-1.2);
  });

  it('falls back to the first waist of the window, and needs two', () => {
    expect(
      evolutionSummary({ ...empty, waist: [point(12, 94), point(1, 93.5)] }, today).waistChangeCm,
    ).toBe(-0.5);
    expect(evolutionSummary({ ...empty, waist: [point(1, 93)] }, today).waistChangeCm).toBeNull();
  });

  it('counts finished workouts against the planned days of two weeks', () => {
    const workouts = [point(0, 1), point(3, 1), point(13, 1), point(14, 1)];
    expect(
      evolutionSummary({ ...empty, workouts, plannedWeekdays: [1, 2, 4, 4, 5] }, today).workouts,
    ).toEqual({ done: 3, planned: 10 });
    expect(evolutionSummary({ ...empty, workouts }, today).workouts).toEqual({
      done: 3,
      planned: null,
    });
    expect(evolutionSummary({ ...empty, plannedWeekdays: [1] }, today).workouts).toEqual({
      done: 0,
      planned: 2,
    });
  });

  it('averages protein and sleep of the window', () => {
    const summary = evolutionSummary(
      {
        ...empty,
        protein: [point(0, 180), point(5, 195), point(20, 50)],
        sleep: [point(1, 450), point(2, 452), point(30, 200)],
      },
      today,
    );
    expect(summary.proteinAverageG).toBe(188);
    expect(summary.sleepAverageMinutes).toBe(451);
  });

  it('calls the volume stable within 5% of the 14 days before', () => {
    const trend = (current: number) =>
      evolutionSummary(
        { ...empty, workouts: [point(2, current), point(20, 1000), point(28, 9999)] },
        today,
      ).performance;
    expect(trend(1050)).toBe('stable');
    expect(trend(950)).toBe('stable');
    expect(trend(1051)).toBe('up');
    expect(trend(949)).toBe('down');
    expect(evolutionSummary({ ...empty, workouts: [point(2, 1000)] }, today).performance).toBe(
      null,
    );
  });
});
