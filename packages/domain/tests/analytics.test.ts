import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  inRange,
  measurementComparison,
  parseLocalDate,
  weightComparison,
  windowRanges,
  type StatPoint,
} from '../src';

const today = parseLocalDate('2026-11-19');
const ago = (days: number) => addDaysToLocalDate(today, -days);
const point = (daysAgo: number, value: number): StatPoint => ({ date: ago(daysAgo), value });

describe('windowRanges (README §20.1)', () => {
  it('ends the window today and puts the previous one right before it', () => {
    expect(windowRanges(7, today)).toEqual({
      current: { from: ago(6), to: today },
      previous: { from: ago(13), to: ago(7) },
    });
    const { current, previous } = windowRanges(30, today);
    expect([current.from, previous.from, previous.to]).toEqual([ago(29), ago(59), ago(30)]);
  });

  it('keeps both edges of a range and nothing outside it', () => {
    const points = [point(7, 1), point(6, 2), point(0, 3), point(-1, 4)];
    expect(inRange(points, windowRanges(7, today).current).map((p) => p.value)).toEqual([2, 3]);
  });
});

describe('weightComparison', () => {
  // One weighing a day for 30 days, losing 0.1 kg a day from 90 kg 29 days ago.
  const daily = Array.from({ length: 30 }, (_, i) => point(29 - i, 87.1 + (29 - i) * 0.1));

  it('labels the result with its method and version', () => {
    expect(weightComparison(daily, 7, today).method).toEqual({ id: 'weight.window', version: 1 });
  });

  it('compares the mean, the moving average and its change per week', () => {
    const { current, previous } = weightComparison(daily, 7, today);
    expect(current).toEqual({
      days: 7,
      averageKg: 87.4,
      trendKg: 87.4,
      changeKg: -0.7,
      ratePerWeekKg: -0.7,
    });
    expect(previous.averageKg).toBe(88.1);
    expect(previous.changeKg).toBe(-0.7);
  });

  it('spreads the change of a longer window over weeks', () => {
    const { current } = weightComparison(daily, 15, today);
    expect(current.changeKg).toBe(-1.5);
    expect(current.ratePerWeekKg).toBe(-0.7);
  });

  it('returns null, never zero, without enough weighings', () => {
    const { current, previous } = weightComparison([point(0, 80), point(3, 81)], 7, today);
    expect(current).toEqual({
      days: 2,
      averageKg: null,
      trendKg: null,
      changeKg: null,
      ratePerWeekKg: null,
    });
    expect(previous.days).toBe(0);
  });

  it('ignores weighings dated after today', () => {
    const withFuture = [...daily, point(-1, 50)];
    expect(weightComparison(withFuture, 7, today)).toEqual(weightComparison(daily, 7, today));
  });
});

describe('measurementComparison', () => {
  const waist = [point(40, 90), point(20, 89), point(10, 88.5), point(2, 87.8)];

  it('measures the change from the last value before the window', () => {
    const { method, current, previous } = measurementComparison(waist, 15, today);
    expect(method).toEqual({ id: 'measurement.window', version: 1 });
    expect(current).toEqual({ days: 2, latestCm: 87.8, changeCm: -1.2 });
    expect(previous).toEqual({ days: 1, latestCm: 89, changeCm: -1 });
  });

  it('falls back to the first value in the window when none came before', () => {
    const { current } = measurementComparison([point(5, 70), point(1, 71.5)], 7, today);
    expect(current.changeCm).toBe(1.5);
  });

  it('has no change with a single value and nothing before it', () => {
    const { current, previous } = measurementComparison([point(1, 70)], 7, today);
    expect(current).toEqual({ days: 1, latestCm: 70, changeCm: null });
    expect(previous).toEqual({ days: 0, latestCm: null, changeCm: null });
  });
});
