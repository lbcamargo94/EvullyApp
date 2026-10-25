import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NUTRITION_PREFERENCES,
  normalizeNutritionPreferences,
  ValidationError,
  visibleMeals,
} from '../src';

describe('normalizeNutritionPreferences', () => {
  it('orders meals like the day and cleans the restrictions note', () => {
    expect(
      normalizeNutritionPreferences({
        meals: ['dinner', 'breakfast', 'lunch', 'dinner'],
        trackWater: false,
        restrictions: '  sem   lactose ',
      }),
    ).toEqual({
      meals: ['breakfast', 'lunch', 'dinner'],
      trackWater: false,
      restrictions: 'sem lactose',
    });
  });

  it('requires a meal and limits the note', () => {
    expect(() =>
      normalizeNutritionPreferences({ ...DEFAULT_NUTRITION_PREFERENCES, meals: [] }),
    ).toThrow(ValidationError);
    expect(() =>
      normalizeNutritionPreferences({
        ...DEFAULT_NUTRITION_PREFERENCES,
        restrictions: 'x'.repeat(281),
      }),
    ).toThrow(ValidationError);
  });

  it('defaults to every meal and water on', () => {
    expect(DEFAULT_NUTRITION_PREFERENCES.meals).toHaveLength(6);
    expect(DEFAULT_NUTRITION_PREFERENCES.trackWater).toBe(true);
  });
});

describe('visibleMeals', () => {
  it('shows chosen meals plus any other meal that has foods that day', () => {
    expect(visibleMeals(['breakfast', 'lunch', 'dinner'], ['supper', 'custom'])).toEqual([
      'breakfast',
      'lunch',
      'dinner',
      'supper',
    ]);
  });
});
