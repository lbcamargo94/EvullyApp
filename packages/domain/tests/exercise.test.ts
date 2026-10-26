import { describe, expect, it } from 'vitest';
import {
  assertUniqueExerciseName,
  ConflictError,
  normalizeExerciseDraft,
  ValidationError,
  type ExerciseDraft,
} from '../src';

const draft: ExerciseDraft = {
  name: '  Remada   cavalinho ',
  muscleGroup: 'back',
  secondaryMuscles: ['biceps', 'back', 'forearms', 'biceps'],
  equipment: ' barra T ',
  instructions: '  Tronco inclinado.\nPuxe até o abdômen. ',
  notes: ' ',
  loadIncrementKg: 2.504,
};

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as ValidationError).code;
  }
  return null;
};

describe('normalizeExerciseDraft', () => {
  it('cleans text, orders secondary muscles and drops the main group from them', () => {
    expect(normalizeExerciseDraft(draft)).toEqual({
      name: 'Remada cavalinho',
      muscleGroup: 'back',
      secondaryMuscles: ['biceps', 'forearms'],
      equipment: 'barra T',
      instructions: 'Tronco inclinado.\nPuxe até o abdômen.',
      notes: null,
      loadIncrementKg: 2.5,
    });
  });

  it('rejects invalid values with stable codes', () => {
    expect(code(() => normalizeExerciseDraft({ ...draft, name: ' ' }))).toBe(
      'exercise.name_required',
    );
    expect(code(() => normalizeExerciseDraft({ ...draft, name: 'x'.repeat(61) }))).toBe(
      'exercise.name_too_long',
    );
    expect(
      code(() =>
        normalizeExerciseDraft({ ...draft, muscleGroup: 'neck' as ExerciseDraft['muscleGroup'] }),
      ),
    ).toBe('exercise.invalid_group');
    expect(code(() => normalizeExerciseDraft({ ...draft, loadIncrementKg: 0 }))).toBe(
      'exercise.increment_out_of_range',
    );
    expect(code(() => normalizeExerciseDraft({ ...draft, equipment: 'x'.repeat(41) }))).toBe(
      'exercise.equipment_too_long',
    );
  });
});

describe('assertUniqueExerciseName', () => {
  it('compares ignoring case', () => {
    expect(() => assertUniqueExerciseName('SUPINO RETO', ['Supino reto'])).toThrow(ConflictError);
    expect(() => assertUniqueExerciseName('Supino declinado', ['Supino reto'])).not.toThrow();
  });
});
