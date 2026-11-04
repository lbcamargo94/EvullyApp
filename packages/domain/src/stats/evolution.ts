import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import type { StatPoint } from './series';

/** Days of the evolution summary window, ending today (README §13.3). */
export const EVOLUTION_DAYS = 14;
/** Volume changes within ±5% count as stable. */
const STABLE_RATIO = 0.05;
/** Weighings needed in each of the two weeks to compare them. */
const MIN_WEIGHINGS_PER_WEEK = 3;

export type PerformanceTrend = 'up' | 'stable' | 'down';

export interface EvolutionInput {
  /** Weight of each day, kg. */
  weights: readonly StatPoint[];
  /** Waist measurements, cm. */
  waist: readonly StatPoint[];
  /** Finished workouts with their volume (load × repetitions), kg. */
  workouts: readonly StatPoint[];
  /** Weekday (1 = Monday) of each planned day of the active plans. */
  plannedWeekdays: readonly number[];
  /** Consumed protein of each day with consumed logs, g. */
  protein: readonly StatPoint[];
  /** Duration of each night, minutes. */
  sleep: readonly StatPoint[];
}

/** Each line is null without enough data for it. */
export interface EvolutionSummary {
  /** Mean of the last 7 days minus the mean of the 7 before, kg/week. */
  weightRatePerWeek: number | null;
  /** Latest waist minus the one before the window (or its first), cm. */
  waistChangeCm: number | null;
  /** Finished workouts and planned days in the window (null without weekdays). */
  workouts: { done: number; planned: number | null } | null;
  proteinAverageG: number | null;
  sleepAverageMinutes: number | null;
  /** Volume of the window against the 14 days before it. */
  performance: PerformanceTrend | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Points from `daysAgo` days before today up to `untilDaysAgo` days before, inclusive. */
function between(
  points: readonly StatPoint[],
  today: LocalDate,
  daysAgo: number,
  untilDaysAgo = 0,
) {
  return points.filter((p) => {
    const age = daysBetween(parseLocalDate(p.date), today);
    return age >= untilDaysAgo && age <= daysAgo;
  });
}

const mean = (points: readonly StatPoint[]) =>
  points.length === 0 ? null : points.reduce((sum, p) => sum + p.value, 0) / points.length;

const total = (points: readonly StatPoint[]) => points.reduce((sum, p) => sum + p.value, 0);

function weightRate(weights: readonly StatPoint[], today: LocalDate): number | null {
  const last = between(weights, today, 6);
  const previous = between(weights, today, 13, 7);
  if (last.length < MIN_WEIGHINGS_PER_WEEK || previous.length < MIN_WEIGHINGS_PER_WEEK) {
    return null;
  }
  return round2((mean(last) ?? 0) - (mean(previous) ?? 0));
}

function waistChange(waist: readonly StatPoint[], today: LocalDate): number | null {
  const start = addDaysToLocalDate(today, -(EVOLUTION_DAYS - 1));
  const sorted = [...waist]
    .filter((p) => daysBetween(parseLocalDate(p.date), today) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const inside = sorted.filter((p) => daysBetween(start, parseLocalDate(p.date)) >= 0);
  const before = sorted.filter((p) => daysBetween(start, parseLocalDate(p.date)) < 0);
  const latest = inside.at(-1);
  const baseline = before.at(-1) ?? inside[0];
  if (!latest || !baseline || latest === baseline) return null;
  return round2(latest.value - baseline.value);
}

function workoutCount(input: EvolutionInput, today: LocalDate) {
  const done = between(input.workouts, today, EVOLUTION_DAYS - 1).length;
  // The window holds each weekday exactly twice.
  const planned =
    input.plannedWeekdays.length > 0 ? (input.plannedWeekdays.length * EVOLUTION_DAYS) / 7 : null;
  return done === 0 && planned === null ? null : { done, planned };
}

function performance(workouts: readonly StatPoint[], today: LocalDate): PerformanceTrend | null {
  const current = total(between(workouts, today, EVOLUTION_DAYS - 1));
  const previous = total(between(workouts, today, 2 * EVOLUTION_DAYS - 1, EVOLUTION_DAYS));
  if (current <= 0 || previous <= 0) return null;
  const change = (current - previous) / previous;
  if (Math.abs(change) <= STABLE_RATIO) return 'stable';
  return change > 0 ? 'up' : 'down';
}

const roundedMean = (points: readonly StatPoint[]) => {
  const value = mean(points);
  return value === null ? null : Math.round(value);
};

/**
 * Objective summary of the last 14 days (README §13.3): plain numbers from
 * the records, never advice.
 */
export function evolutionSummary(input: EvolutionInput, today: LocalDate): EvolutionSummary {
  const window = EVOLUTION_DAYS - 1;
  return {
    weightRatePerWeek: weightRate(input.weights, today),
    waistChangeCm: waistChange(input.waist, today),
    workouts: workoutCount(input, today),
    proteinAverageG: roundedMean(between(input.protein, today, window)),
    sleepAverageMinutes: roundedMean(between(input.sleep, today, window)),
    performance: performance(input.workouts, today),
  };
}

/** True when no line of the summary has data. */
export function isEmptySummary(summary: EvolutionSummary): boolean {
  return Object.values(summary).every((value) => value === null);
}
