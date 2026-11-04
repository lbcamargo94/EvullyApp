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

// ------------------------------------------------------------ sessions (README §10.4)

const setValues = {
  weightKg: z.number().min(0).nullable(),
  repetitions: whole.min(0).nullable(),
  durationSeconds: whole.min(0).nullable(),
  rir: whole.min(0).nullable(),
  completed: z.boolean(),
  notes: z.string().max(200).nullable(),
};

export const startSessionInputSchema = z.object({
  ...profileScoped,
  /** Null for a free session without a plan. */
  workoutDayId: z.uuid().nullable(),
});
export const finishSessionInputSchema = workoutItemIdInputSchema.extend({
  notes: z.string().max(500).nullable(),
});
export const updateSetInputSchema = workoutItemIdInputSchema.extend(setValues);
export const addSetInputSchema = z.object({ ...profileScoped, performanceId: z.uuid() });
export const addPerformanceInputSchema = z.object({
  ...profileScoped,
  sessionId: z.uuid(),
  exerciseId: z.uuid(),
});
export const replacePerformanceInputSchema = workoutItemIdInputSchema.extend({
  exerciseId: z.uuid(),
});

const summarySchema = z.object({
  date: z.string(),
  weightKg: z.number().nullable(),
  values: z.array(z.number()),
  unit: z.enum(['reps', 'seconds']),
});

export const workoutSessionSchema = z.object({
  id: z.string(),
  planName: z.string().nullable(),
  dayName: z.string().nullable(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  notes: z.string().nullable(),
  performances: z.array(
    z.object({
      id: z.string(),
      exerciseId: z.string(),
      exerciseName: z.string(),
      muscleGroup: muscleGroupSchema,
      /** From the plan, when the exercise came from it. */
      prescription: prescriptionSchema.nullable(),
      targetType: z.enum(['reps', 'seconds']),
      /** Previous finished session with this exercise. */
      last: summarySchema.nullable(),
      /** Double progression met last time (README §10.6); null when not. */
      suggestion: z.object({ incrementKg: z.number().nullable() }).nullable(),
      sets: z.array(z.object({ id: z.string(), setNumber: z.number(), ...setValues })),
    }),
  ),
});

// ------------------------------------------------------------ statistics (README §13.2)

/** Finished sessions, oldest first; exercises only with completed values. */
export const workoutStatsSchema = z.array(
  z.object({
    startedAt: z.string(),
    /** Plan day the session followed; null for a free workout. */
    dayId: z.string().nullable(),
    exercises: z.array(
      z.object({
        exerciseId: z.string(),
        name: z.string(),
        topWeightKg: z.number().nullable(),
        volumeKg: z.number(),
      }),
    ),
  }),
);

// ------------------------------------------------------------ history (README §10.5)

export const exerciseHistoryInputSchema = z.object({ ...profileScoped, exerciseId: z.uuid() });
export const setExerciseIncrementInputSchema = exerciseHistoryInputSchema.extend({
  loadIncrementKg: z.number().positive().nullable(),
});

export const exerciseHistorySchema = z.object({
  exerciseId: z.string(),
  /** Increment in use: the profile's, else the exercise's own. */
  loadIncrementKg: z.number().nullable(),
  /** Set by this profile (overrides the exercise's). */
  profileIncrementKg: z.number().nullable(),
  bestLoad: z.object({ weightKg: z.number(), startedAt: z.string() }).nullable(),
  bestSet: z
    .object({ weightKg: z.number(), repetitions: z.number().nullable(), startedAt: z.string() })
    .nullable(),
  recentSessions: z.number(),
  sessions: z.array(
    z.object({
      sessionId: z.string(),
      startedAt: z.string(),
      topWeightKg: z.number().nullable(),
      volumeKg: z.number(),
      sets: z.array(
        z.object({
          setNumber: z.number(),
          weightKg: z.number().nullable(),
          repetitions: z.number().nullable(),
          durationSeconds: z.number().nullable(),
          rir: z.number().nullable(),
        }),
      ),
    }),
  ),
});

// ------------------------------------------------------------ module questionnaire (README §10)

const preferenceValues = {
  experience: z.enum(['beginner', 'intermediate', 'advanced']).nullable(),
  daysPerWeek: whole.nullable(),
  location: z.enum(['gym', 'home', 'both']).nullable(),
  equipment: z
    .array(z.enum(['barbell', 'dumbbells', 'machines', 'cables', 'bench', 'none']))
    .max(6),
};

export const workoutPreferencesInputSchema = z.object({ ...profileScoped, ...preferenceValues });

export const workoutPreferencesSchema = z.object({
  status: z.enum(['pending', 'completed', 'skipped']),
  ...preferenceValues,
  suggestions: z.object({
    rulesVersion: z.string(),
    templates: z.array(
      z.object({
        template: z.enum(['cutting_2026', 'core_home']),
        reason: z.enum(['gym_five_days', 'home_core', 'core_complement']),
      }),
    ),
    buildOwnPlan: z.boolean(),
  }),
});

export type MuscleGroup = z.infer<typeof muscleGroupSchema>;
export type WorkoutPreferencesDto = z.infer<typeof workoutPreferencesSchema>;
export type WorkoutPreferencesInput = z.infer<typeof workoutPreferencesInputSchema>;
export type ExerciseHistoryDto = z.infer<typeof exerciseHistorySchema>;
export type WorkoutStats = z.infer<typeof workoutStatsSchema>;
export type WorkoutSessionDto = z.infer<typeof workoutSessionSchema>;
export type SetValuesDto = Omit<z.infer<typeof updateSetInputSchema>, 'profileId' | 'id'>;
export type PrescriptionDto = z.infer<typeof prescriptionSchema>;
export type WorkoutPlanDto = z.infer<typeof workoutPlanSchema>;
export type PlanTemplateCode = z.infer<typeof importPlanTemplateInputSchema>['template'];
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseInputSchema>;
export type ExerciseDto = z.infer<typeof exerciseSchema>;
