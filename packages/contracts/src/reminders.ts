import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM');

/** Reminder types (README §25). */
export const reminderTypeSchema = z.enum([
  'weighing',
  'measurements',
  'workout',
  'meal',
  'protein',
  'water',
  'habits',
  'sleep',
]);

export const reminderPreferenceSchema = z.object({
  type: reminderTypeSchema,
  enabled: z.boolean(),
  /** Local time, `HH:mm`. */
  time,
  /** ISO weekday (1 = Monday … 7 = Sunday); only measurements use it. */
  weekday: z.number().int().min(1).max(7).nullable(),
});

/** No reminder shows in this window; one due inside it shows when it ends. */
export const quietHoursSchema = z.object({ start: time, end: time });

export const reminderSettingsSchema = z.object({
  preferences: z.array(reminderPreferenceSchema),
  /** Null when the profile has no quiet hours. */
  quietHours: quietHoursSchema.nullable(),
});

export const setReminderSettingsInputSchema = reminderSettingsSchema.extend({
  profileId: z.uuid(),
});

/** Where a clicked notification leads, read once by the window. */
export const reminderOpenSchema = z.object({ profileId: z.string(), route: z.string() }).nullable();

export type ReminderType = z.infer<typeof reminderTypeSchema>;
export type ReminderPreference = z.infer<typeof reminderPreferenceSchema>;
export type QuietHours = z.infer<typeof quietHoursSchema>;
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;
export type SetReminderSettingsInput = z.infer<typeof setReminderSettingsInputSchema>;
export type ReminderOpen = z.infer<typeof reminderOpenSchema>;
