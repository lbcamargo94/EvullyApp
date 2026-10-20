import { z } from 'zod';
import { objectiveSchema } from './tracking';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const tagSchema = z.object({ id: z.string(), name: z.string() });

export const createTagInputSchema = z.object({
  profileId: z.uuid(),
  name: z.string().trim().min(1, 'Informe o nome').max(30, 'Use até 30 caracteres'),
});

/** A weighing as entered on screen; `measuredAt` is the instant in UTC (README §6.2). */
export const weightInputSchema = z.object({
  profileId: z.uuid(),
  measuredOn: localDate,
  measuredAt: z.iso.datetime(),
  weightKg: z.number().positive('Informe o peso'),
  tagIds: z.array(z.uuid()).max(10),
  notes: z.string().trim().max(280, 'Use até 280 caracteres').nullable(),
});

export const updateWeightInputSchema = weightInputSchema.extend({ id: z.uuid() });
export const weightIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

export const weightEntrySchema = z.object({
  id: z.string(),
  measuredOn: localDate,
  measuredAt: z.string(),
  weightKg: z.number(),
  notes: z.string().nullable(),
  tags: z.array(tagSchema),
});

const datedWeight = z.object({ date: localDate, weightKg: z.number() });

/** Figures derived by packages/domain (README §7.2); null when there is not enough data. */
export const weightSummarySchema = z.object({
  objective: objectiveSchema.nullable(),
  current: datedWeight.nullable(),
  /** 7-day moving average ending today; needs weighings on at least 3 of those days. */
  trend: z.number().nullable(),
  start: datedWeight.nullable(),
  /** current − start. */
  change: z.number().nullable(),
  /** trend − start. */
  trendChange: z.number().nullable(),
  /** One point per day with a weighing, oldest first. */
  series: z.array(datedWeight.extend({ trend: z.number().nullable(), tagged: z.boolean() })),
});

export type Tag = z.infer<typeof tagSchema>;
export type CreateTagInput = z.infer<typeof createTagInputSchema>;
export type WeightInput = z.infer<typeof weightInputSchema>;
export type UpdateWeightInput = z.infer<typeof updateWeightInputSchema>;
export type WeightEntry = z.infer<typeof weightEntrySchema>;
export type WeightSummary = z.infer<typeof weightSummarySchema>;

export const renameTagInputSchema = createTagInputSchema.extend({ id: z.uuid() });
export const tagIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

export type RenameTagInput = z.infer<typeof renameTagInputSchema>;
