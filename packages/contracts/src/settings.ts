import { z } from 'zod';
import { updateChannelSchema } from './updates';

/** Minutes without use before returning to profile selection; 0 = never. */
export const inactivityLockOptions = [0, 5, 15, 30] as const;

/** `system` follows Windows; the others force a theme (DESIGN.md). */
export const themeSchema = z.enum(['system', 'light', 'dark']);

export const appSettingsSchema = z.object({
  healthNoticeAcceptedAt: z.string().nullable(),
  inactivityLockMinutes: z.union(inactivityLockOptions.map((m) => z.literal(m))),
  theme: themeSchema,
  updateChannel: updateChannelSchema,
});

export const updateAppSettingsInputSchema = appSettingsSchema
  .pick({ inactivityLockMinutes: true, theme: true, updateChannel: true })
  .partial();

export type Theme = z.infer<typeof themeSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsInputSchema>;
