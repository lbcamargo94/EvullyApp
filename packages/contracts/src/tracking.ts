import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const objectiveSchema = z.enum(['fat_loss', 'muscle_gain', 'recomposition', 'maintenance']);
export const focusAreaSchema = z.enum(['waist', 'hips', 'arms', 'legs', 'chest']);
export const weightDisplaySchema = z.enum(['trend', 'daily', 'hidden']);
const interest = z.enum(['yes', 'no', 'later']).nullable();

export const projectDraftSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do projeto').max(60, 'Use até 60 caracteres'),
  objective: objectiveSchema,
  startDate: localDate,
  targetDate: localDate,
});

/** Answers to the tracking questionnaire, steps 2–7 (README §8.2.1). */
export const trackingAnswersSchema = z.object({
  /** Steps 2 and 3; null when the user skipped the project. */
  project: projectDraftSchema.nullable(),
  focusAreas: z.array(focusAreaSchema).max(5),
  weightDisplay: weightDisplaySchema,
  /** Step 6: interest in features that do not exist yet (README §8.2.4). */
  interests: z.object({
    menstrualCycle: interest,
    progressPhotos: interest,
    pin: z.enum(['yes', 'no']).nullable(),
    weighingDevice: z.enum(['computer', 'phone', 'any']).nullable(),
  }),
  /** Step 7, free text. */
  suggestion: z.string().trim().max(500).nullable(),
});

export const acceptTrackingInputSchema = z.object({
  profileId: z.uuid(),
  answers: trackingAnswersSchema,
});

export const profileScopedInputSchema = z.object({ profileId: z.uuid() });

export const measurementTypeSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  bodyRegion: z.enum(['waist', 'hips', 'arms', 'legs', 'chest', 'other']),
  instructions: z.string(),
  csvName: z.string(),
});

export const trackingConfigSchema = z.object({
  id: z.string(),
  effectiveFrom: localDate,
  weightDisplay: weightDisplaySchema,
  focusAreas: z.array(focusAreaSchema),
  source: z.enum(['questionnaire', 'manual', 'template', 'professional']),
  ruleVersion: z.string().nullable(),
});

/** What a profile tracks today; `questionnaire` is null before onboarding. */
export const trackingStateSchema = z.object({
  questionnaire: z.enum(['completed', 'skipped']).nullable(),
  config: trackingConfigSchema.nullable(),
  measurementTypes: z.array(measurementTypeSchema),
});

export const projectSchema = projectDraftSchema.extend({
  id: z.string(),
  profileId: z.string(),
  status: z.enum(['active', 'completed', 'archived']),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Objective = z.infer<typeof objectiveSchema>;
export type FocusArea = z.infer<typeof focusAreaSchema>;
export type WeightDisplay = z.infer<typeof weightDisplaySchema>;
export type ProjectDraft = z.infer<typeof projectDraftSchema>;
export type TrackingAnswers = z.infer<typeof trackingAnswersSchema>;
export type AcceptTrackingInput = z.infer<typeof acceptTrackingInputSchema>;
export type MeasurementTypeDto = z.infer<typeof measurementTypeSchema>;
export type TrackingConfigDto = z.infer<typeof trackingConfigSchema>;
export type TrackingState = z.infer<typeof trackingStateSchema>;
export type ProjectDto = z.infer<typeof projectSchema>;
