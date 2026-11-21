import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  cardioComparison,
  habitComparison,
  nutritionComparison,
  parseLocalDate,
  sleepComparison,
  stepsComparison,
  type NutritionDayInput,
  type StatPoint,
} from '../src';

const today = parseLocalDate('2026-11-21');
const ago = (days: number) => addDaysToLocalDate(today, -days);
const point = (daysAgo: number, value: number): StatPoint => ({ date: ago(daysAgo), value });

const day = (
  daysAgo: number,
  calories: number,
  targets: Partial<NutritionDayInput> = {},
): NutritionDayInput => ({
  date: ago(daysAgo),
  caloriesKcal: calories,
  proteinG: calories / 20,
  carbohydrateG: calories / 8,
  fatG: calories / 40,
  targetCaloriesKcal: null,
  targetProteinG: null,
  targetCarbohydrateG: null,
  targetFatG: null,
  ...targets,
});

describe('nutritionComparison (README §20.1)', () => {
  it('labels the result with its method and version', () => {
    expect(nutritionComparison([], 7, today).method).toEqual({ id: 'routine.window', version: 1 });
  });

  it('averages the days with a record and compares them with their own targets', () => {
    const history = [
      day(1, 2000, { targetCaloriesKcal: 2000, targetProteinG: 100 }),
      day(2, 1500, { targetCaloriesKcal: 2000, targetProteinG: 100 }),
      day(3, 1900), // before any target
      day(9, 2500),
    ];
    const { current, previous } = nutritionComparison(history, 7, today);
    expect(current.days).toBe(3);
    expect(current.calories).toEqual({ average: 1800, targetPercent: 88 });
    expect(current.protein).toEqual({ average: 90, targetPercent: 88 });
    expect(current.carbohydrate).toEqual({ average: 225, targetPercent: null });
    expect(previous).toMatchObject({ days: 1, calories: { average: 2500, targetPercent: null } });
  });

  it('has no average, never zero, without records', () => {
    const { current } = nutritionComparison([], 7, today);
    expect(current).toMatchObject({ days: 0, calories: { average: null, targetPercent: null } });
  });
});

describe('sleep, cardio and steps', () => {
  it('averages nights and compares them with the nightly target', () => {
    const nights = [point(0, 420), point(1, 480), point(10, 360)];
    const { current, previous } = sleepComparison(nights, 480, 7, today);
    expect(current).toEqual({ nights: 2, averageMinutes: 450, targetPercent: 94 });
    expect(previous).toEqual({ nights: 1, averageMinutes: 360, targetPercent: 75 });
    expect(sleepComparison(nights, null, 7, today).current.targetPercent).toBeNull();
  });

  it('spreads cardio minutes per week against the weekly target', () => {
    const sessions = [
      { date: ago(1), minutes: 40, distanceKm: 5.5 },
      { date: ago(8), minutes: 30, distanceKm: null },
      { date: ago(12), minutes: 30, distanceKm: 4 },
    ];
    const { current } = cardioComparison(sessions, 150, 15, today);
    expect(current).toEqual({
      sessions: 3,
      minutes: 100,
      distanceKm: 9.5,
      minutesPerWeek: 47,
      targetPercent: 31,
    });
  });

  it('counts the days that met the steps target only with a target', () => {
    const steps = [point(0, 9000), point(1, 6000), point(2, 12000)];
    expect(stepsComparison(steps, 8000, 7, today).current).toEqual({
      days: 3,
      average: 9000,
      daysAtTarget: 2,
    });
    expect(stepsComparison(steps, null, 7, today).current.daysAtTarget).toBeNull();
  });
});

describe('habitComparison', () => {
  it('counts the days done by the habits rule over the days of the window', () => {
    const water = { type: 'quantity' as const, targetValue: 2 };
    const history = [point(0, 2.5), point(1, 1), point(3, 2), point(8, 3)];
    const { current, previous } = habitComparison(water, history, 7, today);
    expect(current).toEqual({ done: 2, days: 7 });
    expect(previous).toEqual({ done: 1, days: 7 });
  });
});
