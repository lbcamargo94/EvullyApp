import { ValidationError } from '../errors';
import { daysBetween, parseLocalDate, type LocalDate } from '../local-date';

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;
export const WEIGHT_NOTES_MAX_LENGTH = 280;

export interface WeightDraft {
  measuredOn: string;
  measuredAt: string;
  weightKg: number;
  notes: string | null;
}

/** Validates a weighing (README §6.3, §7.1.1): 20–400 kg, 2 decimals, never in the future. */
export function normalizeWeightDraft(
  draft: WeightDraft,
  today: LocalDate,
): Omit<WeightDraft, 'measuredOn'> & { measuredOn: LocalDate } {
  const measuredOn = parseLocalDate(draft.measuredOn);
  if (daysBetween(measuredOn, today) < 0) {
    throw new ValidationError('weight.date_in_future', 'Weighing date is in the future');
  }
  const { weightKg } = draft;
  if (!Number.isFinite(weightKg) || weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG) {
    throw new ValidationError('weight.out_of_range', 'Weight is out of range');
  }
  const notes = draft.notes?.trim() || null;
  if (notes && [...notes].length > WEIGHT_NOTES_MAX_LENGTH) {
    throw new ValidationError('weight.notes_too_long', 'Notes are too long');
  }
  return {
    measuredOn,
    measuredAt: draft.measuredAt,
    weightKg: Math.round(weightKg * 100) / 100,
    notes,
  };
}
