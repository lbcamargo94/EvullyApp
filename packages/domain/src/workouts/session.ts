import { ValidationError } from '../errors';
import { parseLocalDate, type LocalDate } from '../local-date';

/** One set as typed during a session (README §10.4). Empty fields are null. */
export interface SetValues {
  weightKg: number | null;
  repetitions: number | null;
  durationSeconds: number | null;
  rir: number | null;
  completed: boolean;
  notes: string | null;
}

export const MAX_SET_WEIGHT_KG = 1000;
export const SET_NOTES_MAX_LENGTH = 200;

const invalid = (code: string) => new ValidationError(code, code);

function whole(value: number | null, max: number, code: string): number | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 0 || value > max) throw invalid(code);
  return value;
}

/** Load 0–1000 kg (2 decimals), reps 0–1000, time 0–36000 s, RIR 0–10. */
export function normalizeSetValues(values: SetValues): SetValues {
  let weightKg: number | null = null;
  if (values.weightKg !== null) {
    weightKg = Math.round(values.weightKg * 100) / 100;
    if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > MAX_SET_WEIGHT_KG) {
      throw invalid('set.weight_out_of_range');
    }
  }
  const notes = values.notes?.trim() || null;
  if (notes && [...notes].length > SET_NOTES_MAX_LENGTH) throw invalid('set.notes_too_long');
  return {
    weightKg,
    repetitions: whole(values.repetitions, 1000, 'set.reps_out_of_range'),
    durationSeconds: whole(values.durationSeconds, 36_000, 'set.seconds_out_of_range'),
    rir: whole(values.rir, 10, 'set.rir_out_of_range'),
    completed: values.completed,
    notes,
  };
}

export interface PerformanceSummary {
  /** Heaviest load among completed sets, or null. */
  weightKg: number | null;
  /** Reps (or seconds) of each completed set, in order. */
  values: number[];
  unit: 'reps' | 'seconds';
}

/** "90 kg · 8 / 8 / 7" as data (README §10.4); null when no set was completed. */
export function summarizePerformance(
  sets: readonly Pick<SetValues, 'weightKg' | 'repetitions' | 'durationSeconds' | 'completed'>[],
): PerformanceSummary | null {
  const done = sets.filter((s) => s.completed);
  if (!done.length) return null;
  const unit = done.some((s) => s.repetitions !== null) ? 'reps' : 'seconds';
  const weights = done.flatMap((s) => (s.weightKg === null ? [] : [s.weightKg]));
  return {
    weightKg: weights.length ? Math.max(...weights) : null,
    values: done.flatMap((s) => {
      const value = unit === 'reps' ? s.repetitions : s.durationSeconds;
      return value === null ? [] : [value];
    }),
    unit,
  };
}

/** ISO weekday of a local date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: LocalDate | string): number {
  const [y, m, d] = parseLocalDate(date).split('-').map(Number) as [number, number, number];
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}
