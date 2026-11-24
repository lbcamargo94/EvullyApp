import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const recommendationRuleSchema = z.enum([
  'weight_missing',
  'measurements_missing',
  'double_progression',
  'weight_plateau',
  'weight_rate_out_of_band',
  'volume_drop',
  'low_adherence',
  'tracking_suggestion',
]);

const missingEvidence = z.object({
  lastDate: localDate,
  daysSince: z.number().int(),
  limitDays: z.number().int(),
});

const progressedExercise = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  targetType: z.enum(['reps', 'seconds']),
  sets: z.number().int(),
  top: z.number(),
  values: z.array(z.number()),
  incrementKg: z.number().nullable(),
});

/** Version 1 (one exercise per signal) stays readable in the history; version 2 groups a workout. */
const progressionEvidence = z.union([
  z.object({ lastDate: localDate, exercises: z.array(progressedExercise).min(1) }),
  progressedExercise.extend({ lastDate: localDate }),
]);

const plateauEvidence = z.object({
  objective: z.enum(['fat_loss', 'muscle_gain']),
  days: z.number().int(),
  trendStartKg: z.number(),
  trendEndKg: z.number(),
  changeKg: z.number(),
  limitKg: z.number(),
});

const rateBandEvidence = z.object({
  days: z.number().int(),
  ratePerWeekKg: z.number(),
  minKg: z.number(),
  maxKg: z.number(),
});

const volumeDropEvidence = z.object({
  days: z.number().int(),
  volumesKg: z.tuple([z.number(), z.number(), z.number()]),
  workouts: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
  limitPercent: z.number(),
});

const adherenceEvidence = z.object({
  days: z.number().int(),
  done: z.number().int(),
  planned: z.number().int(),
  percent: z.number(),
  limitPercent: z.number(),
});

const trackingSuggestionEvidence = z.object({
  sourceCode: z.string(),
  sourceName: z.string(),
  suggestedCode: z.string(),
  suggestedName: z.string(),
  firstDate: localDate,
  lastDate: localDate,
  values: z.number().int(),
  changeCm: z.number(),
  days: z.number().int(),
  minSpanDays: z.number().int(),
  limitCm: z.number(),
});

/**
 * The numbers that raised a signal, kept with it (README §20.2,
 * ARCHITECTURE §9). Validated on write and on read, by rule.
 */
export const signalEvidenceSchema = z.discriminatedUnion('ruleId', [
  z.object({ ruleId: z.literal('weight_missing'), evidence: missingEvidence }),
  z.object({ ruleId: z.literal('measurements_missing'), evidence: missingEvidence }),
  z.object({ ruleId: z.literal('double_progression'), evidence: progressionEvidence }),
  z.object({ ruleId: z.literal('weight_plateau'), evidence: plateauEvidence }),
  z.object({ ruleId: z.literal('weight_rate_out_of_band'), evidence: rateBandEvidence }),
  z.object({ ruleId: z.literal('volume_drop'), evidence: volumeDropEvidence }),
  z.object({ ruleId: z.literal('low_adherence'), evidence: adherenceEvidence }),
  z.object({ ruleId: z.literal('tracking_suggestion'), evidence: trackingSuggestionEvidence }),
]);

const signalFields = z.object({
  id: z.string(),
  ruleVersion: z.number().int(),
  subjectKey: z.string(),
  level: z.enum(['info', 'attention']),
  detectedOn: localDate,
  status: z.enum(['open', 'snoozed', 'dismissed', 'accepted', 'resolved']),
  /** Local date the status last changed. */
  statusOn: localDate,
  snoozedUntil: localDate.nullable(),
});

export const recommendationSchema = z.intersection(signalFields, signalEvidenceSchema);

/** Open signals first (newest first), then the recent history of the others. */
export const recommendationListSchema = z.object({
  open: z.array(recommendationSchema),
  history: z.array(recommendationSchema),
});

export const decideRecommendationInputSchema = z.object({
  profileId: z.uuid(),
  id: z.uuid(),
  decision: z.enum(['dismissed', 'snoozed']),
});

/** Accepts a tracking suggestion: the only signal that changes settings, on the user's click. */
export const acceptRecommendationInputSchema = z.object({
  profileId: z.uuid(),
  id: z.uuid(),
});

export const recommendationSettingsSchema = z.object({
  /** Rules the profile turned off; every rule is on by default. */
  disabledRules: z.array(recommendationRuleSchema),
});
export const setRecommendationSettingsInputSchema = recommendationSettingsSchema.extend({
  profileId: z.uuid(),
});

export type RecommendationRule = z.infer<typeof recommendationRuleSchema>;
export type RecommendationDto = z.infer<typeof recommendationSchema>;
export type RecommendationList = z.infer<typeof recommendationListSchema>;
export type DecideRecommendationInput = z.infer<typeof decideRecommendationInputSchema>;
export type AcceptRecommendationInput = z.infer<typeof acceptRecommendationInputSchema>;
export type RecommendationSettings = z.infer<typeof recommendationSettingsSchema>;
