import { describe, expect, it } from 'vitest';
import {
  effectiveAt,
  normalizeNutritionTarget,
  normalizeWaterLog,
  parseLocalDate,
  ValidationError,
} from '../src';

const target = {
  caloriesKcal: 2400.4,
  proteinG: 189.6,
  carbohydrateG: null,
  fatG: 70,
  waterMl: 3500,
};
const today = parseLocalDate('2026-10-25');

describe('normalizeNutritionTarget', () => {
  it('keeps whole numbers and optional values', () => {
    expect(normalizeNutritionTarget(target)).toEqual({
      caloriesKcal: 2400,
      proteinG: 190,
      carbohydrateG: null,
      fatG: 70,
      waterMl: 3500,
    });
  });

  it('rejects zero calories and values out of range', () => {
    expect(() => normalizeNutritionTarget({ ...target, caloriesKcal: 0 })).toThrow(ValidationError);
    expect(() => normalizeNutritionTarget({ ...target, proteinG: -1 })).toThrow(ValidationError);
    expect(() => normalizeNutritionTarget({ ...target, waterMl: 20_001 })).toThrow(ValidationError);
    expect(() => normalizeNutritionTarget({ ...target, fatG: Number.NaN })).toThrow(
      ValidationError,
    );
  });

  it('uses the target in force on a date, like the tracking config (README §7.5, §9.6)', () => {
    const records = [
      { effectiveFrom: parseLocalDate('2026-10-01'), createdAt: 'a', caloriesKcal: 2400 },
      { effectiveFrom: parseLocalDate('2026-10-20'), createdAt: 'b', caloriesKcal: 2200 },
    ];
    expect(effectiveAt(records, parseLocalDate('2026-10-19'))?.caloriesKcal).toBe(2400);
    expect(effectiveAt(records, today)?.caloriesKcal).toBe(2200);
    expect(effectiveAt(records, parseLocalDate('2026-09-30'))).toBeNull();
  });
});

describe('normalizeWaterLog', () => {
  it('accepts 1–5000 ml today or before', () => {
    expect(normalizeWaterLog(250.4, today, today)).toBe(250);
    expect(normalizeWaterLog(500, parseLocalDate('2026-10-01'), today)).toBe(500);
  });

  it('rejects the future and amounts out of range', () => {
    expect(() => normalizeWaterLog(250, parseLocalDate('2026-10-26'), today)).toThrow(
      ValidationError,
    );
    expect(() => normalizeWaterLog(0, today, today)).toThrow(ValidationError);
    expect(() => normalizeWaterLog(5001, today, today)).toThrow(ValidationError);
  });
});
