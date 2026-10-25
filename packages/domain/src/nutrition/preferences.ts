import { ValidationError } from '../errors';
import { MEAL_TYPES, type MealType } from './food-log';

export type StandardMeal = Exclude<MealType, 'custom'>;
export const STANDARD_MEALS = MEAL_TYPES.filter((m): m is StandardMeal => m !== 'custom');

export const NUTRITION_QUESTIONNAIRE_VERSION = 'nutrition@1';
export const RESTRICTIONS_MAX_LENGTH = 280;

/** Answers of the nutrition module questionnaire (README §9, "Questionário do módulo"). */
export interface NutritionPreferences {
  meals: StandardMeal[];
  trackWater: boolean;
  /** Declared by the user, kept as a note only: no clinical questions. */
  restrictions: string | null;
}

/** Used when the questionnaire is skipped: every meal and water on. */
export const DEFAULT_NUTRITION_PREFERENCES: NutritionPreferences = {
  meals: [...STANDARD_MEALS],
  trackWater: true,
  restrictions: null,
};

/** At least one meal, in the order of the day; restrictions up to 280 characters. */
export function normalizeNutritionPreferences(answers: NutritionPreferences): NutritionPreferences {
  const meals = STANDARD_MEALS.filter((meal) => answers.meals.includes(meal));
  if (!meals.length) {
    throw new ValidationError('nutrition_questionnaire.meals_required', 'Choose at least one meal');
  }
  const restrictions = answers.restrictions?.trim().replace(/\s+/g, ' ') || null;
  if (restrictions && [...restrictions].length > RESTRICTIONS_MAX_LENGTH) {
    throw new ValidationError('nutrition_questionnaire.restrictions_too_long', 'Too long');
  }
  return { meals, trackWater: answers.trackWater, restrictions };
}

/**
 * Meals shown on a day (README §9.3): the chosen ones, plus any other
 * standard meal that already has foods that day, so nothing disappears.
 */
export function visibleMeals(
  chosen: readonly StandardMeal[],
  mealsWithFoods: readonly MealType[],
): StandardMeal[] {
  return STANDARD_MEALS.filter((meal) => chosen.includes(meal) || mealsWithFoods.includes(meal));
}
