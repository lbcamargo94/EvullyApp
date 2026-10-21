import { ConflictError, ValidationError } from '../errors';

export type FoodUnit = 'g' | 'ml' | 'portion';

export const FOOD_NAME_MAX_LENGTH = 80;
export const FOOD_BRAND_MAX_LENGTH = 60;
export const FOOD_SOURCE_MAX_LENGTH = 120;
export const MAX_REFERENCE_AMOUNT = 5000;
export const MAX_CALORIES_KCAL = 9000;
export const MAX_SODIUM_MG = 100_000;

/** Nutrients as written on a label: for `referenceAmount` of `referenceUnit` (README §9.2). */
export interface FoodNutrients {
  caloriesKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number | null;
  sodiumMg: number | null;
}

export interface FoodDraft extends FoodNutrients {
  name: string;
  brand: string | null;
  referenceAmount: number;
  referenceUnit: FoodUnit;
  source: string | null;
}

const invalid = (code: string, message: string) => new ValidationError(code, message);
const round1 = (value: number) => Math.round(value * 10) / 10;
const clean = (text: string) => text.trim().replace(/\s+/g, ' ');

function optionalText(value: string | null, max: number, code: string): string | null {
  const text = value === null ? '' : clean(value);
  if ([...text].length > max) throw invalid(code, 'Text is too long');
  return text || null;
}

function amount(value: number, max: number, code: string): number {
  if (!Number.isFinite(value) || value < 0 || value > max) throw invalid(code, 'Out of range');
  return round1(value);
}

/**
 * Validates a food as typed from a label or table (README §9.2). Values are
 * the user's: the app never suggests nutrients. In grams, protein, carbs,
 * fat and fiber cannot weigh more than the reference amount.
 */
export function normalizeFoodDraft(draft: FoodDraft): FoodDraft {
  const name = clean(draft.name);
  if (!name) throw invalid('food.name_required', 'Food name is required');
  if ([...name].length > FOOD_NAME_MAX_LENGTH) throw invalid('food.name_too_long', 'Too long');

  const referenceAmount = round1(draft.referenceAmount);
  if (!(referenceAmount > 0) || referenceAmount > MAX_REFERENCE_AMOUNT) {
    throw invalid('food.amount_out_of_range', 'Reference amount out of range');
  }
  const nutrientMax = draft.referenceUnit === 'g' ? referenceAmount : MAX_REFERENCE_AMOUNT;
  const nutrient = (value: number) => amount(value, nutrientMax, 'food.nutrient_out_of_range');

  const food: FoodDraft = {
    name,
    brand: optionalText(draft.brand, FOOD_BRAND_MAX_LENGTH, 'food.brand_too_long'),
    referenceAmount,
    referenceUnit: draft.referenceUnit,
    caloriesKcal: amount(draft.caloriesKcal, MAX_CALORIES_KCAL, 'food.calories_out_of_range'),
    proteinG: nutrient(draft.proteinG),
    carbohydrateG: nutrient(draft.carbohydrateG),
    fatG: nutrient(draft.fatG),
    fiberG: draft.fiberG === null ? null : nutrient(draft.fiberG),
    sodiumMg:
      draft.sodiumMg === null
        ? null
        : Math.round(amount(draft.sodiumMg, MAX_SODIUM_MG, 'food.nutrient_out_of_range')),
    source: optionalText(draft.source, FOOD_SOURCE_MAX_LENGTH, 'food.source_too_long'),
  };
  if (
    food.referenceUnit === 'g' &&
    food.proteinG + food.carbohydrateG + food.fatG > food.referenceAmount
  ) {
    throw invalid('food.macros_exceed_amount', 'Macros weigh more than the amount');
  }
  return food;
}

const key = (food: { name: string; brand: string | null }) =>
  `${food.name}\u0000${food.brand ?? ''}`.toLocaleLowerCase('pt-BR');

/** The shared catalog has one food per name + brand, ignoring case (README §9.2). */
export function assertUniqueFood(
  food: { name: string; brand: string | null },
  others: readonly { name: string; brand: string | null }[],
): void {
  if (others.some((other) => key(other) === key(food))) {
    throw new ConflictError('food.duplicate', 'Food already exists');
  }
}

/** Nutrients for `quantity` in the food's unit (rule of three, 1 decimal; sodium in whole mg). */
export function nutrientsFor(
  food: FoodNutrients & { referenceAmount: number },
  quantity: number,
): FoodNutrients {
  const factor = quantity / food.referenceAmount;
  const scale = (value: number) => round1(value * factor);
  return {
    caloriesKcal: scale(food.caloriesKcal),
    proteinG: scale(food.proteinG),
    carbohydrateG: scale(food.carbohydrateG),
    fatG: scale(food.fatG),
    fiberG: food.fiberG === null ? null : scale(food.fiberG),
    sodiumMg: food.sodiumMg === null ? null : Math.round(food.sodiumMg * factor),
  };
}
