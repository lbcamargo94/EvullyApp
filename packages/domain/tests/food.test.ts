import { describe, expect, it } from 'vitest';
import {
  assertUniqueFood,
  ConflictError,
  normalizeFoodDraft,
  nutrientsFor,
  ValidationError,
  type FoodDraft,
} from '../src';

const rice: FoodDraft = {
  name: '  Arroz   branco cozido ',
  brand: ' ',
  referenceAmount: 100,
  referenceUnit: 'g',
  caloriesKcal: 128.04,
  proteinG: 2.52,
  carbohydrateG: 28.06,
  fatG: 0.23,
  fiberG: 1.6,
  sodiumMg: 1.4,
  source: 'TACO',
};

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as ValidationError).code;
  }
  return null;
};

describe('normalizeFoodDraft', () => {
  it('cleans text and rounds values', () => {
    expect(normalizeFoodDraft(rice)).toEqual({
      ...rice,
      name: 'Arroz branco cozido',
      brand: null,
      caloriesKcal: 128,
      proteinG: 2.5,
      carbohydrateG: 28.1,
      fatG: 0.2,
      fiberG: 1.6,
      sodiumMg: 1,
    });
  });

  it('accepts portions and liquids', () => {
    const portion = normalizeFoodDraft({ ...rice, referenceAmount: 1, referenceUnit: 'portion' });
    expect(portion.carbohydrateG).toBe(28.1); // grams per portion may exceed "1"
    const honey = { ...rice, referenceUnit: 'ml', carbohydrateG: 112, proteinG: 0, fatG: 0 };
    expect(normalizeFoodDraft(honey as FoodDraft).carbohydrateG).toBe(112);
  });

  it('rejects invalid values with stable codes', () => {
    expect(code(() => normalizeFoodDraft({ ...rice, name: ' ' }))).toBe('food.name_required');
    expect(code(() => normalizeFoodDraft({ ...rice, name: 'x'.repeat(81) }))).toBe(
      'food.name_too_long',
    );
    expect(code(() => normalizeFoodDraft({ ...rice, referenceAmount: 0 }))).toBe(
      'food.amount_out_of_range',
    );
    expect(code(() => normalizeFoodDraft({ ...rice, caloriesKcal: -1 }))).toBe(
      'food.calories_out_of_range',
    );
    expect(code(() => normalizeFoodDraft({ ...rice, proteinG: Number.NaN }))).toBe(
      'food.nutrient_out_of_range',
    );
    expect(code(() => normalizeFoodDraft({ ...rice, fatG: 101 }))).toBe(
      'food.nutrient_out_of_range',
    );
    expect(code(() => normalizeFoodDraft({ ...rice, proteinG: 40, carbohydrateG: 70 }))).toBe(
      'food.macros_exceed_amount',
    );
    expect(code(() => normalizeFoodDraft({ ...rice, source: 's'.repeat(121) }))).toBe(
      'food.source_too_long',
    );
  });
});

describe('assertUniqueFood', () => {
  const catalog = [{ name: 'Arroz branco cozido', brand: null }];

  it('rejects the same name and brand, ignoring case', () => {
    expect(() => assertUniqueFood({ name: 'ARROZ BRANCO COZIDO', brand: null }, catalog)).toThrow(
      ConflictError,
    );
  });

  it('allows the same name with another brand', () => {
    expect(() =>
      assertUniqueFood({ name: 'Arroz branco cozido', brand: 'Tio João' }, catalog),
    ).not.toThrow();
  });
});

describe('nutrientsFor', () => {
  it('scales the label values to the quantity eaten', () => {
    const food = normalizeFoodDraft(rice);
    expect(nutrientsFor(food, 150)).toEqual({
      caloriesKcal: 192,
      proteinG: 3.8,
      carbohydrateG: 42.2,
      fatG: 0.3,
      fiberG: 2.4,
      sodiumMg: 2,
    });
  });

  it('keeps missing nutrients missing', () => {
    expect(nutrientsFor({ ...rice, fiberG: null, sodiumMg: null }, 50)).toMatchObject({
      fiberG: null,
      sodiumMg: null,
    });
  });
});
