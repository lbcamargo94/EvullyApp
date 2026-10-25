import { describe, expect, it } from 'vitest';
import {
  assertCanConsume,
  dailyTotals,
  normalizeFoodLogDraft,
  normalizeLogQuantity,
  parseLocalDate,
  ValidationError,
} from '../src';

const today = parseLocalDate('2026-10-22');
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as ValidationError).code;
  }
  return null;
};
const lunch = {
  logDate: '2026-10-22',
  mealType: 'lunch',
  mealName: 'x',
  quantity: 150.04,
} as const;

describe('normalizeFoodLogDraft', () => {
  it('rounds the quantity and drops the name of standard meals', () => {
    expect(normalizeFoodLogDraft(lunch, today)).toEqual({
      logDate: '2026-10-22',
      mealType: 'lunch',
      mealName: null,
      quantity: 150,
    });
  });

  it('allows past days and planning up to 30 days ahead', () => {
    expect(normalizeFoodLogDraft({ ...lunch, logDate: '2025-01-01' }, today).logDate).toBe(
      '2025-01-01',
    );
    expect(normalizeFoodLogDraft({ ...lunch, logDate: '2026-11-21' }, today).logDate).toBe(
      '2026-11-21',
    );
    expect(code(() => normalizeFoodLogDraft({ ...lunch, logDate: '2026-11-22' }, today))).toBe(
      'food_log.date_too_far',
    );
  });

  it('requires a name for custom meals', () => {
    const custom = { ...lunch, mealType: 'custom' as const };
    expect(normalizeFoodLogDraft({ ...custom, mealName: ' Pós  treino ' }, today).mealName).toBe(
      'Pós treino',
    );
    expect(code(() => normalizeFoodLogDraft({ ...custom, mealName: ' ' }, today))).toBe(
      'food_log.meal_name_required',
    );
    expect(code(() => normalizeFoodLogDraft({ ...custom, mealName: 'x'.repeat(41) }, today))).toBe(
      'food_log.meal_name_too_long',
    );
  });
});

describe('normalizeLogQuantity', () => {
  it('accepts (0, 10000] with one decimal', () => {
    expect(normalizeLogQuantity(0.05)).toBe(0.1);
    expect(code(() => normalizeLogQuantity(0))).toBe('food_log.quantity_out_of_range');
    expect(code(() => normalizeLogQuantity(10_000.1))).toBe('food_log.quantity_out_of_range');
    expect(code(() => normalizeLogQuantity(Number.NaN))).toBe('food_log.quantity_out_of_range');
  });
});

describe('assertCanConsume', () => {
  it('accepts today and the past, never the future', () => {
    expect(() => assertCanConsume(today, today)).not.toThrow();
    expect(() => assertCanConsume(parseLocalDate('2026-10-01'), today)).not.toThrow();
    expect(code(() => assertCanConsume(parseLocalDate('2026-10-23'), today))).toBe(
      'food_log.consume_future',
    );
  });
});

describe('dailyTotals', () => {
  const n = (kcal: number, p: number, c: number, f: number) => ({
    caloriesKcal: kcal,
    proteinG: p,
    carbohydrateG: c,
    fatG: f,
    fiberG: null,
    sodiumMg: null,
  });

  it('sums everything planned and only what was consumed', () => {
    expect(
      dailyTotals([
        { nutrients: n(192, 3.8, 42.2, 0.3), consumed: true },
        { nutrients: n(330, 62, 0, 7.2), consumed: true },
        { nutrients: n(76, 4.8, 13.6, 0.5), consumed: false },
      ]),
    ).toEqual({
      planned: { caloriesKcal: 598, proteinG: 70.6, carbohydrateG: 55.8, fatG: 8 },
      consumed: { caloriesKcal: 522, proteinG: 65.8, carbohydrateG: 42.2, fatG: 7.5 },
    });
  });

  it('is zero for an empty day', () => {
    const zero = { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };
    expect(dailyTotals([])).toEqual({ planned: zero, consumed: zero });
  });
});
