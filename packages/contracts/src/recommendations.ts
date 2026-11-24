import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const recommendationRuleSchema = z.enum([
  'weight_missing',
  'measurements_missing',
  'double_progression',
]);

const missingEvidence = z.object({
  lastDate: localDate,
  daysSince: z.number().int(),
  limitDays: z.number().int(),
});

const progressionEvidence = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  lastDate: localDate,
  targetType: z.enum(['reps', 'seconds']),
  sets: z.number().int(),
  top: z.number(),
  values: z.array(z.number()),
  incrementKg: z.number().nullable(),
});

/**
 * The numbers that raised a signal, kept with it (README §20.2,
 * ARCHITECTURE §9). Validated on write and on read, by rule.
 */
export const signalEvidenceSchema = z.discriminatedUnion('ruleId', [
  z.object({ ruleId: z.literal('weight_missing'), evidence: missingEvidence }),
  z.object({ ruleId: z.literal('measurements_missing'), evidence: missingEvidence }),
  z.object({ ruleId: z.literal('double_progression'), evidence: progressionEvidence }),
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
export type RecommendationSettings = z.infer<typeof recommendationSettingsSchema>;
