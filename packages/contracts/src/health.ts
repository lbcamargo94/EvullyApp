import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');
const optionalText = (max: number) =>
  z.string().trim().max(max, `Use até ${max} caracteres`).nullable();

/** One result as typed from the laboratory report (README §24.2). */
export const healthResultValuesSchema = z.object({
  /** Catalog code (README §24.3); null for a marker typed by name. */
  analyteCode: z.string().max(40).nullable(),
  analyteName: z.string().trim().min(1, 'Informe o marcador').max(80, 'Use até 80 caracteres'),
  value: z.number().finite(),
  unit: z.string().trim().min(1, 'Informe a unidade').max(20, 'Use até 20 caracteres'),
  /** The laboratory's own reference range, never a global one. */
  referenceMin: z.number().finite().nullable(),
  referenceMax: z.number().finite().nullable(),
  referenceText: optionalText(120),
});

const examValues = {
  collectedOn: localDate,
  laboratory: optionalText(80),
  notes: optionalText(500),
  results: z.array(healthResultValuesSchema).min(1, 'Informe ao menos um resultado').max(200),
};

export const healthExamInputSchema = z.object({ profileId: z.uuid(), ...examValues });
export const updateHealthExamInputSchema = healthExamInputSchema.extend({ id: z.uuid() });
export const healthExamIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

/** Where a value sits against the laboratory range; `unknown` without one. */
export const healthResultFlagSchema = z.enum(['below', 'within', 'above', 'unknown']);

export const healthResultSchema = healthResultValuesSchema.extend({
  id: z.string(),
  /** Derived from the laboratory range, never typed. */
  flag: healthResultFlagSchema,
});

export const healthExamSchema = z.object({
  id: z.string(),
  collectedOn: localDate,
  laboratory: z.string().nullable(),
  notes: z.string().nullable(),
  results: z.array(healthResultSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Per profile: the Saúde area starts hidden (README §24). */
export const healthSettingsSchema = z.object({
  enabled: z.boolean(),
  /** When the profile accepted the notice that this is not medical advice. */
  noticeAcceptedAt: z.string().nullable(),
});

export const setHealthSettingsInputSchema = z.object({
  profileId: z.uuid(),
  enabled: z.boolean(),
});

export type HealthResultValues = z.infer<typeof healthResultValuesSchema>;
export type HealthExamInput = z.infer<typeof healthExamInputSchema>;
export type UpdateHealthExamInput = z.infer<typeof updateHealthExamInputSchema>;
export type HealthResultFlag = z.infer<typeof healthResultFlagSchema>;
export type HealthResultDto = z.infer<typeof healthResultSchema>;
export type HealthExamDto = z.infer<typeof healthExamSchema>;
export type HealthSettings = z.infer<typeof healthSettingsSchema>;
export type SetHealthSettingsInput = z.infer<typeof setHealthSettingsInputSchema>;
