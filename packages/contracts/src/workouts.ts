import { z } from 'zod';

export const muscleGroupSchema = z.enum([
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
]);

const exerciseValues = {
  name: z.string().trim().min(1, 'Informe o nome').max(60, 'Use até 60 caracteres'),
  muscleGroup: muscleGroupSchema,
  secondaryMuscles: z.array(muscleGroupSchema).max(12),
  equipment: z.string().trim().max(40, 'Use até 40 caracteres').nullable(),
  instructions: z.string().max(1000, 'Use até 1000 caracteres').nullable(),
  notes: z.string().max(500, 'Use até 500 caracteres').nullable(),
  loadIncrementKg: z.number().positive().nullable(),
};

export const exerciseInputSchema = z.object({ profileId: z.uuid(), ...exerciseValues });
export const updateExerciseInputSchema = exerciseInputSchema.extend({ id: z.uuid() });
export const exerciseIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

/** System exercises (`isSystem`) are shared and read-only; the others belong to the profile. */
export const exerciseSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  isSystem: z.boolean(),
  ...exerciseValues,
});

export type MuscleGroup = z.infer<typeof muscleGroupSchema>;
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseInputSchema>;
export type ExerciseDto = z.infer<typeof exerciseSchema>;
