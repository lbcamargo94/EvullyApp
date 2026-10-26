import { ConflictError, ValidationError } from '../errors';

/** Muscle groups of README §10.1, in display order. */
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'lower_back',
  'cardio_other',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EXERCISE_NAME_MAX_LENGTH = 60;
export const EQUIPMENT_MAX_LENGTH = 40;
export const INSTRUCTIONS_MAX_LENGTH = 1000;
export const EXERCISE_NOTES_MAX_LENGTH = 500;
export const MAX_LOAD_INCREMENT_KG = 50;

export interface ExerciseDraft {
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string | null;
  instructions: string | null;
  notes: string | null;
  /** Suggested load step for progression (README §10.6); null = not set. */
  loadIncrementKg: number | null;
}

const invalid = (code: string) => new ValidationError(code, code);
const clean = (text: string) => text.trim().replace(/\s+/g, ' ');

function optional(value: string | null, max: number, code: string, keepLines = false) {
  const text = value === null ? '' : keepLines ? value.trim() : clean(value);
  if ([...text].length > max) throw invalid(code);
  return text || null;
}

/** Validates a profile's own exercise (README §10.1). */
export function normalizeExerciseDraft(draft: ExerciseDraft): ExerciseDraft {
  const name = clean(draft.name);
  if (!name) throw invalid('exercise.name_required');
  if ([...name].length > EXERCISE_NAME_MAX_LENGTH) throw invalid('exercise.name_too_long');
  if (!MUSCLE_GROUPS.includes(draft.muscleGroup)) throw invalid('exercise.invalid_group');
  const secondaryMuscles = MUSCLE_GROUPS.filter(
    (g) => g !== draft.muscleGroup && draft.secondaryMuscles.includes(g),
  );
  let loadIncrementKg: number | null = null;
  if (draft.loadIncrementKg !== null) {
    loadIncrementKg = Math.round(draft.loadIncrementKg * 100) / 100;
    if (!(loadIncrementKg > 0) || loadIncrementKg > MAX_LOAD_INCREMENT_KG) {
      throw invalid('exercise.increment_out_of_range');
    }
  }
  return {
    name,
    muscleGroup: draft.muscleGroup,
    secondaryMuscles,
    equipment: optional(draft.equipment, EQUIPMENT_MAX_LENGTH, 'exercise.equipment_too_long'),
    instructions: optional(
      draft.instructions,
      INSTRUCTIONS_MAX_LENGTH,
      'exercise.instructions_too_long',
      true,
    ),
    notes: optional(draft.notes, EXERCISE_NOTES_MAX_LENGTH, 'exercise.notes_too_long', true),
    loadIncrementKg,
  };
}

const key = (name: string) => name.toLocaleLowerCase('pt-BR');

/** One exercise per name among the system catalog and the profile's own, ignoring case. */
export function assertUniqueExerciseName(name: string, others: readonly string[]): void {
  if (others.some((other) => key(other) === key(name))) {
    throw new ConflictError('exercise.duplicate', 'Exercise already exists');
  }
}
