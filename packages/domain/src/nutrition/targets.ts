import { ValidationError } from '../errors';
import { daysBetween, type LocalDate } from '../local-date';

/** Daily targets typed by the user (README §9.6); single values, never computed by the app. */
export interface NutritionTargetValues {
  caloriesKcal: number;
  proteinG: number;
  carbohydrateG: number | null;
  fatG: number | null;
  waterMl: number | null;
}

const LIMITS = {
  caloriesKcal: 10_000,
  proteinG: 1000,
  carbohydrateG: 2000,
  fatG: 1000,
  waterMl: 20_000,
} as const;

function value(raw: number, max: number): number {
  if (!Number.isFinite(raw) || raw < 0 || raw > max) {
    throw new ValidationError('nutrition_target.out_of_range', 'Target is out of range');
  }
  return Math.round(raw);
}

/** Whole numbers within broad sanity limits; calories must be above zero. */
export function normalizeNutritionTarget(draft: NutritionTargetValues): NutritionTargetValues {
  const caloriesKcal = value(draft.caloriesKcal, LIMITS.caloriesKcal);
  if (caloriesKcal === 0) {
    throw new ValidationError('nutrition_target.out_of_range', 'Calories must be above zero');
  }
  const optional = (raw: number | null, max: number) => (raw === null ? null : value(raw, max));
  return {
    caloriesKcal,
    proteinG: value(draft.proteinG, LIMITS.proteinG),
    carbohydrateG: optional(draft.carbohydrateG, LIMITS.carbohydrateG),
    fatG: optional(draft.fatG, LIMITS.fatG),
    waterMl: optional(draft.waterMl, LIMITS.waterMl),
  };
}

export const MAX_WATER_LOG_ML = 5000;

/** One water entry: 1–5000 ml, today or a past day (README §9.4.1). */
export function normalizeWaterLog(amountMl: number, logDate: LocalDate, today: LocalDate): number {
  if (daysBetween(logDate, today) < 0) {
    throw new ValidationError('water.date_in_future', 'Water date is in the future');
  }
  const ml = Math.round(amountMl);
  if (!Number.isFinite(amountMl) || ml < 1 || ml > MAX_WATER_LOG_ML) {
    throw new ValidationError('water.amount_out_of_range', 'Water amount is out of range');
  }
  return ml;
}
