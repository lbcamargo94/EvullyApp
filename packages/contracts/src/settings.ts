import { z } from 'zod';

/** Minutes without use before returning to profile selection; 0 = never. */
export const inactivityLockOptions = [0, 5, 15, 30] as const;

export const appSettingsSchema = z.object({
  healthNoticeAcceptedAt: z.string().nullable(),
  inactivityLockMinutes: z.union(inactivityLockOptions.map((m) => z.literal(m))),
});

export const updateAppSettingsInputSchema = appSettingsSchema
  .pick({ inactivityLockMinutes: true })
  .partial();

export type AppSettings = z.infer<typeof appSettingsSchema>;
export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsInputSchema>;
