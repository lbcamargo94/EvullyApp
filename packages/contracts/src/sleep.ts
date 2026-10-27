import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

const sleepValues = {
  /** Local day the person wakes up on (README §7.7). */
  sleepDate: localDate,
  /** Instants in UTC (README §6.2); `sleepTime` is optional. */
  bedTime: z.iso.datetime(),
  sleepTime: z.iso.datetime().nullable(),
  wakeTime: z.iso.datetime(),
  quality: z.number().int().min(1).max(5).nullable(),
  notes: z.string().trim().max(280, 'Use até 280 caracteres').nullable(),
};

export const sleepInputSchema = z.object({ profileId: z.uuid(), ...sleepValues });
export const updateSleepInputSchema = sleepInputSchema.extend({ id: z.uuid() });
export const sleepIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

export const sleepLogSchema = z.object({
  id: z.string(),
  ...sleepValues,
  /** Derived from the times, never typed (README §7.7). */
  durationMinutes: z.number(),
});

export type SleepInput = z.infer<typeof sleepInputSchema>;
export type UpdateSleepInput = z.infer<typeof updateSleepInputSchema>;
export type SleepLogDto = z.infer<typeof sleepLogSchema>;
