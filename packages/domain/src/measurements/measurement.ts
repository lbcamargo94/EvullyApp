import { ValidationError } from '../errors';
import { daysBetween, parseLocalDate, type LocalDate } from '../local-date';

export const MIN_MEASUREMENT_CM = 5;
export const MAX_MEASUREMENT_CM = 300;
export const MEASUREMENT_NOTES_MAX_LENGTH = 280;

export interface MeasurementValueDraft {
  measurementTypeId: string;
  valueCm: number;
}

export interface MeasurementDraft {
  measuredOn: string;
  measuredAt: string;
  values: readonly MeasurementValueDraft[];
  notes: string | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Validates a measuring session (README §6.3, §8.3): at least one value, each
 * 5–300 cm with one decimal, one value per type, never in the future.
 */
export function normalizeMeasurementDraft(
  draft: MeasurementDraft,
  today: LocalDate,
): Omit<MeasurementDraft, 'measuredOn'> & { measuredOn: LocalDate } {
  const measuredOn = parseLocalDate(draft.measuredOn);
  if (daysBetween(measuredOn, today) < 0) {
    throw new ValidationError('measurement.date_in_future', 'Measurement date is in the future');
  }
  if (draft.values.length === 0) {
    throw new ValidationError('measurement.empty', 'At least one measurement is required');
  }
  const types = new Set(draft.values.map((v) => v.measurementTypeId));
  if (types.size !== draft.values.length) {
    throw new ValidationError('measurement.duplicate_type', 'Measurement type repeated');
  }
  const values = draft.values.map(({ measurementTypeId, valueCm }) => {
    if (!Number.isFinite(valueCm) || valueCm < MIN_MEASUREMENT_CM || valueCm > MAX_MEASUREMENT_CM) {
      throw new ValidationError('measurement.out_of_range', 'Measurement is out of range');
    }
    return { measurementTypeId, valueCm: round1(valueCm) };
  });
  const notes = draft.notes?.trim() || null;
  if (notes && [...notes].length > MEASUREMENT_NOTES_MAX_LENGTH) {
    throw new ValidationError('measurement.notes_too_long', 'Notes are too long');
  }
  return { measuredOn, measuredAt: draft.measuredAt, values, notes };
}

export interface MeasuredValue {
  measuredOn: LocalDate;
  measuredAt: string;
  valueCm: number;
}

export interface DatedValue {
  date: LocalDate;
  valueCm: number;
}

export interface MeasurementTypeStats {
  current: DatedValue | null;
  start: DatedValue | null;
  change: number | null;
  series: DatedValue[];
}

/**
 * Stats for one measurement type (README §7.3): one value per day (latest),
 * latest value, first value on or after the project start (or the first ever
 * without a project) and the change between them.
 */
export function measurementTypeStats(
  values: readonly MeasuredValue[],
  projectStart: LocalDate | null,
): MeasurementTypeStats {
  const byDay = new Map<string, MeasuredValue>();
  for (const v of values) {
    const day = byDay.get(v.measuredOn);
    if (!day || v.measuredAt > day.measuredAt) byDay.set(v.measuredOn, v);
  }
  const series = [...byDay.values()]
    .map((v) => ({ date: v.measuredOn, valueCm: v.valueCm }))
    .sort((a, b) => daysBetween(b.date, a.date));
  const current = series.at(-1) ?? null;
  const start = series.find((p) => !projectStart || daysBetween(projectStart, p.date) >= 0) ?? null;
  return {
    current,
    start,
    change: current && start ? round1(current.valueCm - start.valueCm) : null,
    series,
  };
}
