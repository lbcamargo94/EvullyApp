import { ValidationError } from '../errors';
import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';

export const SLEEP_QUALITIES = [1, 2, 3, 4, 5] as const;
export const MAX_SLEEP_SPAN_MINUTES = 20 * 60;
export const SLEEP_NOTES_MAX_LENGTH = 280;
export const MIN_SLEEP_TARGET_MINUTES = 60;
export const MAX_SLEEP_TARGET_MINUTES = 16 * 60;

/** Nightly sleep target typed by the person (README §13.1); null clears it. */
export interface SleepTargetValues {
  minutesPerNight: number | null;
}

/**
 * One night as typed (README §7.7, §12.1). Times are UTC instants; `sleepTime`
 * (fell asleep) is optional. The night belongs to the local day of `wakeTime`.
 */
export interface SleepDraft {
  sleepDate: string;
  bedTime: string;
  sleepTime: string | null;
  wakeTime: string;
  /** 1 (very bad) to 5 (very good). */
  quality: number | null;
  notes: string | null;
}

export interface NormalizedSleep extends Omit<SleepDraft, 'sleepDate'> {
  sleepDate: LocalDate;
  /** Derived here only, never typed (README §7.7). */
  durationMinutes: number;
}

const invalid = (code: string) => new ValidationError(code, code);

function instant(value: string): number {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) throw invalid('sleep.invalid_time');
  return ms;
}

function quality(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw invalid('sleep.quality_out_of_range');
  }
  return value;
}

/**
 * Validates a night: bed ≤ asleep < wake, at most 20 h from bed to wake, nothing
 * in the future. The duration runs from falling asleep (or going to bed) to waking.
 */
export function normalizeSleepDraft(
  draft: SleepDraft,
  today: LocalDate,
  nowIso: string,
): NormalizedSleep {
  const sleepDate = parseLocalDate(draft.sleepDate);
  if (daysBetween(sleepDate, today) < 0) throw invalid('sleep.date_in_future');
  const bed = instant(draft.bedTime);
  const wake = instant(draft.wakeTime);
  const asleep = draft.sleepTime === null ? bed : instant(draft.sleepTime);
  if (wake > instant(nowIso)) throw invalid('sleep.time_in_future');
  if (asleep < bed || wake <= asleep) throw invalid('sleep.order');
  if (wake - bed > MAX_SLEEP_SPAN_MINUTES * 60_000) throw invalid('sleep.too_long');
  const notes = draft.notes?.trim() || null;
  if (notes && [...notes].length > SLEEP_NOTES_MAX_LENGTH) throw invalid('sleep.notes_too_long');
  return {
    sleepDate,
    bedTime: draft.bedTime,
    sleepTime: draft.sleepTime,
    wakeTime: draft.wakeTime,
    quality: quality(draft.quality),
    notes,
    durationMinutes: Math.round((wake - asleep) / 60_000),
  };
}

export function normalizeSleepTarget(draft: SleepTargetValues): SleepTargetValues {
  const minutes = draft.minutesPerNight;
  if (
    minutes !== null &&
    (!Number.isInteger(minutes) ||
      minutes < MIN_SLEEP_TARGET_MINUTES ||
      minutes > MAX_SLEEP_TARGET_MINUTES)
  ) {
    throw invalid('sleep_target.out_of_range');
  }
  return { minutesPerNight: minutes };
}

/**
 * Local day of a bedtime or falling-asleep clock time (minutes after midnight)
 * for a night that ends on `wakeDate`: at or after the wake clock time it was
 * the evening before, otherwise the same day (e.g. bed at 00:30, wake at 07:00).
 */
export function nightClockDate(wakeDate: LocalDate, clock: number, wakeClock: number): LocalDate {
  return clock >= wakeClock ? addDaysToLocalDate(wakeDate, -1) : wakeDate;
}

const DAY_MINUTES = 24 * 60;

/** A night with local clock times in minutes after midnight (the caller knows the time zone). */
export interface SleepNightClock {
  sleepDate: string;
  durationMinutes: number;
  /** Fell asleep, or went to bed when that is unknown. */
  startClock: number;
  wakeClock: number;
}

export interface SleepAverage {
  /** Whole minutes; null without nights in the window. */
  minutes: number | null;
  nights: number;
}

export interface SleepIndicators {
  last7: SleepAverage;
  last30: SleepAverage;
  /** Mean clock times over 30 days, minutes after midnight; null without nights. */
  bedtime: number | null;
  wakeTime: number | null;
  /** Mean deviation in minutes of both clock times over 30 days; null below 2 nights. */
  consistency: number | null;
}

const toAngle = (clock: number) => (clock / DAY_MINUTES) * 2 * Math.PI;

/** Circular mean, so 23:30 and 00:30 average to 00:00 instead of 12:00. */
function meanClock(clocks: readonly number[]): number {
  const sin = clocks.reduce((t, c) => t + Math.sin(toAngle(c)), 0);
  const cos = clocks.reduce((t, c) => t + Math.cos(toAngle(c)), 0);
  const minutes = Math.round((Math.atan2(sin, cos) / (2 * Math.PI)) * DAY_MINUTES);
  return (minutes + DAY_MINUTES) % DAY_MINUTES;
}

/** Shortest distance between two clock times, across midnight. */
function clockDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % DAY_MINUTES;
  return Math.min(d, DAY_MINUTES - d);
}

const meanDeviation = (clocks: readonly number[], mean: number) =>
  clocks.reduce((t, c) => t + clockDistance(c, mean), 0) / clocks.length;

function average(nights: readonly SleepNightClock[]): SleepAverage {
  if (nights.length === 0) return { minutes: null, nights: 0 };
  const total = nights.reduce((t, n) => t + n.durationMinutes, 0);
  return { minutes: Math.round(total / nights.length), nights: nights.length };
}

/**
 * Indicators of README §12.2 over the nights ending on `today`: 7- and 30-day
 * averages, mean bedtime and wake time, and consistency. Exact figures, no advice.
 */
export function sleepIndicators(
  nights: readonly SleepNightClock[],
  today: LocalDate,
): SleepIndicators {
  const within = (days: number) => {
    const from = addDaysToLocalDate(today, 1 - days);
    return nights.filter((n) => n.sleepDate >= from && n.sleepDate <= today);
  };
  const month = within(30);
  const starts = month.map((n) => n.startClock);
  const wakes = month.map((n) => n.wakeClock);
  const bedtime = month.length ? meanClock(starts) : null;
  const wakeTime = month.length ? meanClock(wakes) : null;
  const consistency =
    month.length >= 2 && bedtime !== null && wakeTime !== null
      ? Math.round((meanDeviation(starts, bedtime) + meanDeviation(wakes, wakeTime)) / 2)
      : null;
  return { last7: average(within(7)), last30: average(month), bedtime, wakeTime, consistency };
}
