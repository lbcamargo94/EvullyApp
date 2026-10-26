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

// ------------------------------------------------------------ plans (README §10.2, §10.3)

const whole = z.number().int();

export const prescriptionSchema = z.object({
  sets: whole,
  targetType: z.enum(['reps', 'seconds']),
  minReps: whole.nullable(),
  maxReps: whole.nullable(),
  minSeconds: whole.nullable(),
  maxSeconds: whole.nullable(),
  perSide: z.boolean(),
  minRir: whole.nullable(),
  maxRir: whole.nullable(),
  minRestSeconds: whole.nullable(),
  maxRestSeconds: whole.nullable(),
  notes: z.string().max(200).nullable(),
});

const profileScoped = { profileId: z.uuid() };
const direction = z.enum(['up', 'down']);
const weekday = whole.min(1).max(7).nullable();

export const createWorkoutPlanInputSchema = z.object({
  ...profileScoped,
  name: z.string().trim().min(1, 'Informe o nome').max(60, 'Use até 60 caracteres'),
});
export const updateWorkoutPlanInputSchema = createWorkoutPlanInputSchema.extend({
  id: z.uuid(),
  status: z.enum(['active', 'archived']),
});
export const importPlanTemplateInputSchema = z.object({
  ...profileScoped,
  template: z.enum(['cutting_2026', 'core_home']),
});
export const addWorkoutDayInputSchema = z.object({
  ...profileScoped,
  planId: z.uuid(),
  name: z.string().trim().min(1).max(40),
  weekday,
});
export const updateWorkoutDayInputSchema = z.object({
  ...profileScoped,
  id: z.uuid(),
  name: z.string().trim().min(1).max(40),
  weekday,
});
export const workoutItemIdInputSchema = z.object({ ...profileScoped, id: z.uuid() });
export const moveWorkoutItemInputSchema = workoutItemIdInputSchema.extend({ direction });
export const addPlanExerciseInputSchema = z.object({
  ...profileScoped,
  dayId: z.uuid(),
  exerciseId: z.uuid(),
  prescription: prescriptionSchema,
});
export const updatePlanExerciseInputSchema = workoutItemIdInputSchema.extend({
  prescription: prescriptionSchema,
});

export const workoutPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'archived']),
  days: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      weekday,
      exercises: z.array(
        z.object({
          id: z.string(),
          exerciseId: z.string(),
          exerciseName: z.string(),
          muscleGroup: muscleGroupSchema,
          /** False when the exercise was deactivated in the library. */
          exerciseActive: z.boolean(),
          prescription: prescriptionSchema,
        }),
      ),
    }),
  ),
});

export type MuscleGroup = z.infer<typeof muscleGroupSchema>;
export type PrescriptionDto = z.infer<typeof prescriptionSchema>;
export type WorkoutPlanDto = z.infer<typeof workoutPlanSchema>;
export type PlanTemplateCode = z.infer<typeof importPlanTemplateInputSchema>['template'];
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseInputSchema>;
export type ExerciseDto = z.infer<typeof exerciseSchema>;
