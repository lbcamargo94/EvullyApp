import { ValidationError } from '../errors';
import { daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import type { FoodNutrients, FoodUnit } from './food';

/** Meal types of README §9.3, in the order of the day; `custom` carries a name. */
export const MEAL_TYPES = [
  'breakfast',
  'morning_snack',
  'lunch',
  'pre_workout',
  'dinner',
  'supper',
  'custom',
] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MAX_PLANNING_DAYS = 30;
export const MAX_LOG_QUANTITY = 10_000;
export const MEAL_NAME_MAX_LENGTH = 40;

/** What a log keeps of the food: later edits to the food never change it (README §9.4). */
export interface FoodSnapshot extends FoodNutrients {
  name: string;
  brand: string | null;
  referenceAmount: number;
  referenceUnit: FoodUnit;
}

export interface FoodLogDraft {
  logDate: string;
  mealType: MealType;
  mealName: string | null;
  quantity: number;
}

const invalid = (code: string) => new ValidationError(code, code);

/** Logged quantity in the food's unit: above 0, up to 10,000, one decimal. */
export function normalizeLogQuantity(quantity: number): number {
  const rounded = Math.round(quantity * 10) / 10;
  if (!Number.isFinite(quantity) || rounded <= 0 || rounded > MAX_LOG_QUANTITY) {
    throw invalid('food_log.quantity_out_of_range');
  }
  return rounded;
}

/**
 * Validates a food log. Past dates are allowed; future dates only to plan,
 * up to 30 days ahead. A custom meal needs a name; the others never have one.
 */
export function normalizeFoodLogDraft(
  draft: FoodLogDraft,
  today: LocalDate,
): Omit<FoodLogDraft, 'logDate'> & { logDate: LocalDate } {
  const logDate = parseLocalDate(draft.logDate);
  if (daysBetween(today, logDate) > MAX_PLANNING_DAYS) throw invalid('food_log.date_too_far');
  let mealName: string | null = null;
  if (draft.mealType === 'custom') {
    mealName = (draft.mealName ?? '').trim().replace(/\s+/g, ' ');
    if (!mealName) throw invalid('food_log.meal_name_required');
    if ([...mealName].length > MEAL_NAME_MAX_LENGTH) throw invalid('food_log.meal_name_too_long');
  }
  return {
    logDate,
    mealType: draft.mealType,
    mealName,
    quantity: normalizeLogQuantity(draft.quantity),
  };
}

/** Only what already happened can be consumed: never a future day. */
export function assertCanConsume(logDate: LocalDate, today: LocalDate): void {
  if (daysBetween(today, logDate) > 0) throw invalid('food_log.consume_future');
}

export interface MacroTotals {
  caloriesKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

function sum(items: readonly FoodNutrients[]): MacroTotals {
  const total = { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };
  for (const n of items) {
    total.caloriesKcal += n.caloriesKcal;
    total.proteinG += n.proteinG;
    total.carbohydrateG += n.carbohydrateG;
    total.fatG += n.fatG;
  }
  return {
    caloriesKcal: round1(total.caloriesKcal),
    proteinG: round1(total.proteinG),
    carbohydrateG: round1(total.carbohydrateG),
    fatG: round1(total.fatG),
  };
}

/** Day totals (README §9.5): everything planned, and what was marked as consumed. */
export function dailyTotals(logs: readonly { nutrients: FoodNutrients; consumed: boolean }[]): {
  planned: MacroTotals;
  consumed: MacroTotals;
} {
  return {
    planned: sum(logs.map((l) => l.nutrients)),
    consumed: sum(logs.filter((l) => l.consumed).map((l) => l.nutrients)),
  };
}
