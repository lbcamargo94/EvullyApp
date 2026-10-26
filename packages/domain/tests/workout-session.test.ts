import { describe, expect, it } from 'vitest';
import { isoWeekday, normalizeSetValues, summarizePerformance, ValidationError } from '../src';

const set = {
  weightKg: 90.004,
  repetitions: 8,
  durationSeconds: null,
  rir: 2,
  completed: true,
  notes: '  ',
};
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as ValidationError).code;
  }
  return null;
};

describe('normalizeSetValues', () => {
  it('rounds the load and drops blank notes', () => {
    expect(normalizeSetValues(set)).toEqual({ ...set, weightKg: 90, notes: null });
  });

  it('allows empty fields and rejects values out of range', () => {
    expect(
      normalizeSetValues({ ...set, weightKg: null, repetitions: null, rir: null }),
    ).toMatchObject({
      weightKg: null,
      repetitions: null,
    });
    expect(code(() => normalizeSetValues({ ...set, weightKg: 1000.5 }))).toBe(
      'set.weight_out_of_range',
    );
    expect(code(() => normalizeSetValues({ ...set, repetitions: 8.5 }))).toBe(
      'set.reps_out_of_range',
    );
    expect(code(() => normalizeSetValues({ ...set, rir: 11 }))).toBe('set.rir_out_of_range');
  });
});

describe('summarizePerformance', () => {
  it('summarizes completed sets: heaviest load and reps in order', () => {
    expect(
      summarizePerformance([
        { weightKg: 90, repetitions: 8, durationSeconds: null, completed: true },
        { weightKg: 90, repetitions: 8, durationSeconds: null, completed: true },
        { weightKg: 87.5, repetitions: 7, durationSeconds: null, completed: true },
        { weightKg: 90, repetitions: null, durationSeconds: null, completed: false },
      ]),
    ).toEqual({ weightKg: 90, values: [8, 8, 7], unit: 'reps' });
  });

  it('uses seconds for timed exercises and null when nothing was done', () => {
    expect(
      summarizePerformance([
        { weightKg: null, repetitions: null, durationSeconds: 45, completed: true },
      ]),
    ).toEqual({ weightKg: null, values: [45], unit: 'seconds' });
    expect(summarizePerformance([])).toBeNull();
  });
});

describe('isoWeekday', () => {
  it('counts Monday as 1 and Sunday as 7', () => {
    expect(isoWeekday('2026-10-26')).toBe(1);
    expect(isoWeekday('2026-10-25')).toBe(7);
  });
});
