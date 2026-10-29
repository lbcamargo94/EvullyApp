import { weekStartOf } from '../cardio/cardio';
import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';

/** Periods of the statistics screen (README §13.2). */
export const STATS_PERIODS = ['days30', 'days90', 'project', 'all'] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];

export interface StatPoint {
  date: string;
  value: number;
}

export interface WeekAverage {
  /** Monday of the ISO week. */
  weekStart: LocalDate;
  average: number;
  /** Days with a value in that week. */
  days: number;
}

export interface WeeklyRate {
  weekStart: LocalDate;
  /** Change of the weekly average from the week before, per week. */
  ratePerWeek: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * First day of a period ending today; null means no lower bound. "project"
 * without an active project behaves as "all".
 */
export function periodStart(
  period: StatsPeriod,
  today: LocalDate,
  projectStart: LocalDate | null,
): LocalDate | null {
  if (period === 'days30') return addDaysToLocalDate(today, -29);
  if (period === 'days90') return addDaysToLocalDate(today, -89);
  return period === 'project' ? projectStart : null;
}

/** Points on or after `from` (all of them when `from` is null). */
export function inPeriod<T extends { date: string }>(points: readonly T[], from: LocalDate | null) {
  return from ? points.filter((p) => daysBetween(from, parseLocalDate(p.date)) >= 0) : [...points];
}

/** Mean of the values of each ISO week (Monday to Sunday), oldest first. */
export function weeklyAverages(points: readonly StatPoint[]): WeekAverage[] {
  const weeks = new Map<LocalDate, number[]>();
  for (const p of points) {
    const start = weekStartOf(parseLocalDate(p.date));
    weeks.set(start, [...(weeks.get(start) ?? []), p.value]);
  }
  return [...weeks.entries()]
    .map(([weekStart, values]) => ({
      weekStart,
      average: round2(values.reduce((sum, v) => sum + v, 0) / values.length),
      days: values.length,
    }))
    .sort((a, b) => daysBetween(b.weekStart, a.weekStart));
}

/**
 * Speed of change (e.g. kg/week): the difference between the averages of
 * consecutive weeks. A gap of several weeks is divided by its length.
 */
export function weeklyRates(weeks: readonly WeekAverage[]): WeeklyRate[] {
  return weeks.slice(1).flatMap((week, i) => {
    const previous = weeks[i];
    if (!previous) return [];
    const gap = daysBetween(previous.weekStart, week.weekStart) / 7;
    return [
      { weekStart: week.weekStart, ratePerWeek: round2((week.average - previous.average) / gap) },
    ];
  });
}
