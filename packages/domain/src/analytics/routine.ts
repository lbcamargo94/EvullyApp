import type { LocalDate } from '../local-date';
import { isHabitDone, type HabitDraft } from '../habits/habit';
import type { StatPoint } from '../stats/series';
import {
  inRange,
  meanOf,
  windowRanges,
  type AnalyticsMethod,
  type AnalyticsWindow,
  type DateRange,
  type PeriodComparison,
} from './windows';

/**
 * Nutrition and routine in a window (README §20.1): means of the days with a
 * record, and a mean against its target as a percentage, never a count of
 * days "within" a target (targets are single values, README §9.6). Steps and
 * habits count the days that met their own target, as the habits rule does.
 */
export const ROUTINE_WINDOW_METHOD: AnalyticsMethod = { id: 'routine.window', version: 1 };

export interface NutritionDayInput {
  date: string;
  caloriesKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  targetCaloriesKcal: number | null;
  targetProteinG: number | null;
  targetCarbohydrateG: number | null;
  targetFatG: number | null;
}

export interface AgainstTarget {
  /** Mean per day with a record. */
  average: number | null;
  /** Consumed on the days with a target over the sum of those targets, %. */
  targetPercent: number | null;
}

export interface NutritionWindow {
  /** Days with consumed food. */
  days: number;
  calories: AgainstTarget;
  protein: AgainstTarget;
  carbohydrate: AgainstTarget;
  fat: AgainstTarget;
}

export interface SleepWindow {
  nights: number;
  averageMinutes: number | null;
  /** Mean duration over the current nightly target, %. */
  targetPercent: number | null;
}

export interface CardioWindow {
  sessions: number;
  minutes: number;
  distanceKm: number;
  /** Minutes spread over the window, per 7 days. */
  minutesPerWeek: number;
  /** Minutes per week over the weekly target, %. */
  targetPercent: number | null;
}

export interface StepsWindow {
  days: number;
  average: number | null;
  /** Days at or above the target; null without a target. */
  daysAtTarget: number | null;
}

export interface HabitWindow {
  done: number;
  /** Days in the window. */
  days: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const percent = (part: number, whole: number) => Math.round((part / whole) * 100);

type Macro = 'calories' | 'protein' | 'carbohydrate' | 'fat';
type Numeric = Exclude<keyof NutritionDayInput, 'date'>;
const FIELDS: Record<Macro, [Numeric, Numeric]> = {
  calories: ['caloriesKcal', 'targetCaloriesKcal'],
  protein: ['proteinG', 'targetProteinG'],
  carbohydrate: ['carbohydrateG', 'targetCarbohydrateG'],
  fat: ['fatG', 'targetFatG'],
};

function againstTarget(days: readonly NutritionDayInput[], macro: Macro): AgainstTarget {
  const [valueKey, targetKey] = FIELDS[macro];
  const value = (d: NutritionDayInput) => d[valueKey] ?? 0;
  const average = meanOf(days.map((d) => ({ date: d.date, value: value(d) })));
  const targeted = days.filter((d) => d[targetKey] !== null);
  const targetSum = targeted.reduce((sum, d) => sum + (d[targetKey] ?? 0), 0);
  return {
    average: average === null ? null : macro === 'calories' ? Math.round(average) : round1(average),
    targetPercent:
      targetSum > 0
        ? percent(
            targeted.reduce((sum, d) => sum + value(d), 0),
            targetSum,
          )
        : null,
  };
}

function compare<T>(
  days: AnalyticsWindow,
  today: LocalDate,
  window: (range: DateRange) => T,
): PeriodComparison<T> {
  const ranges = windowRanges(days, today);
  return {
    method: ROUTINE_WINDOW_METHOD,
    current: window(ranges.current),
    previous: window(ranges.previous),
  };
}

/** Consumed calories and macros, each against the target of its own day. */
export function nutritionComparison(
  history: readonly NutritionDayInput[],
  days: AnalyticsWindow,
  today: LocalDate,
): PeriodComparison<NutritionWindow> {
  return compare(days, today, (range) => {
    const inside = inRange(history, range);
    return {
      days: inside.length,
      calories: againstTarget(inside, 'calories'),
      protein: againstTarget(inside, 'protein'),
      carbohydrate: againstTarget(inside, 'carbohydrate'),
      fat: againstTarget(inside, 'fat'),
    };
  });
}

/** Nights by wake-up date; `targetMinutes` is the current nightly target. */
export function sleepComparison(
  nights: readonly StatPoint[],
  targetMinutes: number | null,
  days: AnalyticsWindow,
  today: LocalDate,
): PeriodComparison<SleepWindow> {
  return compare(days, today, (range) => {
    const inside = inRange(nights, range);
    const average = meanOf(inside);
    return {
      nights: inside.length,
      averageMinutes: average === null ? null : Math.round(average),
      targetPercent: average !== null && targetMinutes ? percent(average, targetMinutes) : null,
    };
  });
}

export interface CardioInput {
  date: string;
  minutes: number;
  distanceKm: number | null;
}

/** Sessions, minutes and distance; minutes per week against the weekly target. */
export function cardioComparison(
  sessions: readonly CardioInput[],
  weeklyTargetMinutes: number | null,
  days: AnalyticsWindow,
  today: LocalDate,
): PeriodComparison<CardioWindow> {
  return compare(days, today, (range) => {
    const inside = inRange(sessions, range);
    const minutes = inside.reduce((sum, s) => sum + s.minutes, 0);
    const minutesPerWeek = Math.round((minutes * 7) / days);
    return {
      sessions: inside.length,
      minutes,
      distanceKm: round1(inside.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0)),
      minutesPerWeek,
      targetPercent: weeklyTargetMinutes ? percent(minutesPerWeek, weeklyTargetMinutes) : null,
    };
  });
}

/** Steps of the days with a value; days at target only with a target. */
export function stepsComparison(
  steps: readonly StatPoint[],
  target: number | null,
  days: AnalyticsWindow,
  today: LocalDate,
): PeriodComparison<StepsWindow> {
  return compare(days, today, (range) => {
    const inside = inRange(steps, range);
    const average = meanOf(inside);
    return {
      days: inside.length,
      average: average === null ? null : Math.round(average),
      daysAtTarget: target === null ? null : inside.filter((p) => p.value >= target).length,
    };
  });
}

/** Days a habit was done, by the habits rule (README §11.2), over the days of the window. */
export function habitComparison(
  habit: Pick<HabitDraft, 'type' | 'targetValue'>,
  history: readonly StatPoint[],
  days: AnalyticsWindow,
  today: LocalDate,
): PeriodComparison<HabitWindow> {
  return compare(days, today, (range) => ({
    done: inRange(history, range).filter((p) => isHabitDone(habit, p.value)).length,
    days,
  }));
}
