import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import type { StatPoint } from '../stats/series';

/** Windows of the Analytics Engine, in days, ending today (README §20.1). */
export const ANALYTICS_WINDOWS = [7, 15, 30, 60] as const;
export type AnalyticsWindow = (typeof ANALYTICS_WINDOWS)[number];

/** Inclusive range of local dates. */
export interface DateRange {
  from: LocalDate;
  to: LocalDate;
}

/**
 * Which calculation produced a figure. Computed on demand, never stored
 * (ARCHITECTURE §9): the version changes whenever the method changes, so a
 * figure can always be told apart from one made by an older rule.
 */
export interface AnalyticsMethod {
  id: string;
  version: number;
}

/** A window and the window of the same length right before it. */
export interface PeriodComparison<T> {
  method: AnalyticsMethod;
  current: T;
  previous: T;
}

/** The last `days` days up to today, and the `days` days before them. */
export function windowRanges(
  days: AnalyticsWindow,
  today: LocalDate,
): { current: DateRange; previous: DateRange } {
  const from = addDaysToLocalDate(today, -(days - 1));
  return {
    current: { from, to: today },
    previous: { from: addDaysToLocalDate(from, -days), to: addDaysToLocalDate(from, -1) },
  };
}

/** Points whose date falls in the range, keeping their order. */
export function inRange<T extends { date: string }>(points: readonly T[], range: DateRange): T[] {
  return points.filter((p) => {
    const date = parseLocalDate(p.date);
    return daysBetween(range.from, date) >= 0 && daysBetween(date, range.to) >= 0;
  });
}

/** Points dated before the range starts, keeping their order. */
export function beforeRange<T extends { date: string }>(
  points: readonly T[],
  range: DateRange,
): T[] {
  return points.filter((p) => daysBetween(parseLocalDate(p.date), range.from) > 0);
}

export const meanOf = (points: readonly StatPoint[]) =>
  points.length === 0 ? null : points.reduce((sum, p) => sum + p.value, 0) / points.length;
