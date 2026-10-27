import { ValidationError } from '../errors';
import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';

export const SLEEP_QUALITIES = [1, 2, 3, 4, 5] as const;
export const MAX_SLEEP_SPAN_MINUTES = 20 * 60;
export const SLEEP_NOTES_MAX_LENGTH = 280;

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

/**
 * Local day of a bedtime or falling-asleep clock time (minutes after midnight)
 * for a night that ends on `wakeDate`: at or after the wake clock time it was
 * the evening before, otherwise the same day (e.g. bed at 00:30, wake at 07:00).
 */
export function nightClockDate(wakeDate: LocalDate, clock: number, wakeClock: number): LocalDate {
  return clock >= wakeClock ? addDaysToLocalDate(wakeDate, -1) : wakeDate;
}
