import { z } from 'zod';
import { measurementTypeSchema, objectiveSchema } from './tracking';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

/** One measuring session (README §8.3): several measurements taken together. */
export const measurementInputSchema = z.object({
  profileId: z.uuid(),
  measuredOn: localDate,
  measuredAt: z.iso.datetime(),
  values: z
    .array(z.object({ measurementTypeId: z.uuid(), valueCm: z.number().positive() }))
    .min(1, 'Preencha pelo menos uma medida')
    .max(20),
  notes: z.string().trim().max(280, 'Use até 280 caracteres').nullable(),
});

export const updateMeasurementInputSchema = measurementInputSchema.extend({ id: z.uuid() });
export const measurementIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

export const measurementSessionSchema = z.object({
  id: z.string(),
  measuredOn: localDate,
  measuredAt: z.string(),
  notes: z.string().nullable(),
  values: z.array(
    z.object({
      measurementTypeId: z.string(),
      code: z.string(),
      name: z.string(),
      valueCm: z.number(),
    }),
  ),
});

const datedValue = z.object({ date: localDate, valueCm: z.number() });

/** Per tracked measurement: latest, first within the project and change (README §7.3). */
export const measurementSummarySchema = z.object({
  objective: objectiveSchema.nullable(),
  items: z.array(
    measurementTypeSchema.extend({
      current: datedValue.nullable(),
      start: datedValue.nullable(),
      /** current − start. */
      change: z.number().nullable(),
      /** One point per day, oldest first. */
      series: z.array(datedValue),
    }),
  ),
});

export type MeasurementInput = z.infer<typeof measurementInputSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementInputSchema>;
export type MeasurementSession = z.infer<typeof measurementSessionSchema>;
export type MeasurementSummary = z.infer<typeof measurementSummarySchema>;
export type MeasurementSummaryItem = MeasurementSummary['items'][number];
