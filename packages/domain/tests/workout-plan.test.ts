import { describe, expect, it } from 'vitest';
import {
  availablePlanName,
  ConflictError,
  moveInOrder,
  normalizePlanName,
  normalizePrescription,
  normalizeWorkoutDay,
  PLAN_TEMPLATES,
  ValidationError,
  type Prescription,
} from '../src';

const bench: Prescription = {
  sets: 3,
  targetType: 'reps',
  minReps: 6,
  maxReps: 8,
  minSeconds: 30,
  maxSeconds: 45,
  perSide: false,
  minRir: 1,
  maxRir: 2,
  minRestSeconds: 150,
  maxRestSeconds: 180,
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

describe('normalizePrescription (README §10.3)', () => {
  it('keeps the pair of the target type and clears the other', () => {
    expect(normalizePrescription(bench)).toEqual({
      ...bench,
      minSeconds: null,
      maxSeconds: null,
      notes: null,
    });
    const plank = normalizePrescription({ ...bench, targetType: 'seconds', perSide: true });
    expect(plank).toMatchObject({ minReps: null, maxReps: null, minSeconds: 30, maxSeconds: 45 });
  });

  it('turns a single value into a fixed range and allows no RIR or rest', () => {
    expect(
      normalizePrescription({
        ...bench,
        minReps: 10,
        maxReps: null,
        minRir: null,
        maxRir: null,
        minRestSeconds: null,
        maxRestSeconds: null,
      }),
    ).toMatchObject({ minReps: 10, maxReps: 10, minRir: null, maxRestSeconds: null });
  });

  it('rejects invalid values with stable codes', () => {
    expect(code(() => normalizePrescription({ ...bench, sets: 0 }))).toBe(
      'prescription.sets_out_of_range',
    );
    expect(code(() => normalizePrescription({ ...bench, minReps: 9, maxReps: 8 }))).toBe(
      'prescription.reps_out_of_range',
    );
    expect(code(() => normalizePrescription({ ...bench, minReps: null, maxReps: null }))).toBe(
      'prescription.target_required',
    );
    expect(code(() => normalizePrescription({ ...bench, maxRir: 11 }))).toBe(
      'prescription.rir_out_of_range',
    );
    expect(code(() => normalizePrescription({ ...bench, minReps: 6.5 }))).toBe(
      'prescription.reps_out_of_range',
    );
  });
});

describe('plan names and days', () => {
  it('validates names and finds a free one for imports', () => {
    expect(normalizePlanName('  Cutting   2026 ', [])).toBe('Cutting 2026');
    expect(() => normalizePlanName('cutting 2026', ['Cutting 2026'])).toThrow(ConflictError);
    expect(availablePlanName('Cutting 2026', ['Cutting 2026', 'cutting 2026 (2)'])).toBe(
      'Cutting 2026 (3)',
    );
  });

  it('validates days and weekdays', () => {
    expect(normalizeWorkoutDay({ name: ' PUSH ', weekday: 2 })).toEqual({
      name: 'PUSH',
      weekday: 2,
    });
    expect(code(() => normalizeWorkoutDay({ name: 'PUSH', weekday: 8 }))).toBe(
      'workout_day.invalid_weekday',
    );
  });

  it('moves items one position', () => {
    expect(moveInOrder(['a', 'b', 'c'], 'c', 'up')).toEqual(['a', 'c', 'b']);
    expect(moveInOrder(['a', 'b', 'c'], 'a', 'up')).toEqual(['a', 'b', 'c']);
  });
});

describe('PLAN_TEMPLATES (README §10.7, §10.8)', () => {
  it('has valid prescriptions everywhere', () => {
    for (const plan of PLAN_TEMPLATES) {
      for (const day of plan.days) {
        for (const { prescription } of day.exercises) {
          expect(() => normalizePrescription(prescription)).not.toThrow();
        }
      }
    }
  });

  it('matches the README program', () => {
    const cutting = PLAN_TEMPLATES.find((p) => p.code === 'cutting_2026');
    expect(cutting?.days.map((d) => [d.weekday, d.exercises.length])).toEqual([
      [1, 10],
      [2, 6],
      [3, 6],
      [4, 10],
      [5, 7],
    ]);
    expect(cutting?.days[1]?.exercises[0]).toMatchObject({
      exerciseCode: 'bench_press',
      prescription: { sets: 3, minReps: 6, maxReps: 8, minRir: 1, maxRir: 2 },
    });
  });
});
