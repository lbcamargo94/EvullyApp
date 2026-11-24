import { describe, expect, it } from 'vitest';
import { normalizeRateBand, ValidationError } from '../src';

describe('normalizeRateBand (README §7.1)', () => {
  it('accepts both ends or none, rounded to hundredths', () => {
    expect(normalizeRateBand({ weeklyRateMinKg: -0.754, weeklyRateMaxKg: -0.25 })).toEqual({
      weeklyRateMinKg: -0.75,
      weeklyRateMaxKg: -0.25,
    });
    expect(normalizeRateBand({ weeklyRateMinKg: null, weeklyRateMaxKg: null })).toEqual({
      weeklyRateMinKg: null,
      weeklyRateMaxKg: null,
    });
  });

  it('refuses one end alone, an inverted band and more than 2 kg/week', () => {
    const codes = [
      { weeklyRateMinKg: -0.5, weeklyRateMaxKg: null },
      { weeklyRateMinKg: 0.5, weeklyRateMaxKg: 0.25 },
      { weeklyRateMinKg: -2.5, weeklyRateMaxKg: 0 },
    ].map((band) => {
      try {
        normalizeRateBand(band);
        return null;
      } catch (e) {
        return e instanceof ValidationError ? e.code : 'other';
      }
    });
    expect(codes).toEqual([
      'project.rate_band_incomplete',
      'project.rate_band_inverted',
      'project.rate_band_out_of_range',
    ]);
  });
});
