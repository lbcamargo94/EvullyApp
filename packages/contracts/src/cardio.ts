import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const cardioActivitySchema = z.enum([
  'walking',
  'cycling',
  'running',
  'elliptical',
  'custom',
]);
export const cardioIntensitySchema = z.enum(['light', 'moderate', 'vigorous']);

const cardioValues = {
  sessionDate: localDate,
  /** Start instant in UTC (README §6.2). */
  startedAt: z.iso.datetime(),
  activityType: cardioActivitySchema,
  activityName: z.string().trim().max(40, 'Use até 40 caracteres').nullable(),
  durationMinutes: z.number().int().positive('Informe a duração'),
  distanceKm: z.number().min(0).nullable(),
  steps: z.number().int().min(0).nullable(),
  intensity: cardioIntensitySchema.nullable(),
  heartRateAverage: z.number().int().positive().nullable(),
  notes: z.string().trim().max(280, 'Use até 280 caracteres').nullable(),
};

export const cardioInputSchema = z.object({ profileId: z.uuid(), ...cardioValues });
export const updateCardioInputSchema = cardioInputSchema.extend({ id: z.uuid() });
export const cardioIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

export const cardioSessionSchema = z.object({ id: z.string(), ...cardioValues });

const weekSummarySchema = z.object({
  weekStart: localDate,
  sessions: z.number(),
  minutes: z.number(),
  distanceKm: z.number(),
  byActivity: z.array(
    z.object({
      activityType: cardioActivitySchema,
      activityName: z.string().nullable(),
      sessions: z.number(),
      minutes: z.number(),
      distanceKm: z.number(),
    }),
  ),
});

const targetValues = {
  sessionsPerWeek: z.number().int().positive().nullable(),
  minutesPerWeek: z.number().int().positive().nullable(),
};

/** A new weekly target from today on; both null clears it (README §11.1). */
export const cardioTargetInputSchema = z.object({ profileId: z.uuid(), ...targetValues });
export const cardioTargetSchema = z.object({
  id: z.string(),
  effectiveFrom: localDate,
  ...targetValues,
  createdAt: z.string(),
});

/** This week's summary and target in force, plus every week with sessions, newest first. */
export const cardioOverviewSchema = z.object({
  thisWeek: weekSummarySchema,
  /** Null when no target is in force or the latest one was cleared. */
  target: cardioTargetSchema.nullable(),
  weeks: z.array(z.object({ summary: weekSummarySchema, sessions: z.array(cardioSessionSchema) })),
});

export type CardioActivity = z.infer<typeof cardioActivitySchema>;
export type CardioIntensity = z.infer<typeof cardioIntensitySchema>;
export type CardioInput = z.infer<typeof cardioInputSchema>;
export type UpdateCardioInput = z.infer<typeof updateCardioInputSchema>;
export type CardioSessionDto = z.infer<typeof cardioSessionSchema>;
export type CardioTargetInput = z.infer<typeof cardioTargetInputSchema>;
export type CardioTargetDto = z.infer<typeof cardioTargetSchema>;
export type CardioOverview = z.infer<typeof cardioOverviewSchema>;
