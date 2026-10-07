import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const sexSchema = z.enum(['male', 'female']);

/** Shape checks only; business rules (ranges, future dates) live in packages/domain. */
export const profileInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(60, 'Use até 60 caracteres'),
  birthDate: localDate.nullable(),
  sex: sexSchema.nullable(),
  heightCm: z.number().positive().nullable(),
});

export const updateProfileInputSchema = profileInputSchema.extend({ id: z.uuid() });

export const profileIdInputSchema = z.object({ id: z.uuid() });

export const profileSchema = profileInputSchema.extend({
  id: z.string(),
  unitSystem: z.literal('metric'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** What the profile selection screen may show: never personal data (README §8.1). */
export const profileSummarySchema = z.object({ id: z.string(), name: z.string() });

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type ProfileDto = z.infer<typeof profileSchema>;
export type ProfileSummary = z.infer<typeof profileSummarySchema>;
