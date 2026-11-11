import { z } from 'zod';

/** What a validated transfer file holds, shown before anything is written (README §14.4). */
export const transferPreviewSchema = z.object({
  token: z.string(),
  fileName: z.string(),
  profileName: z.string(),
  exportedAt: z.string(),
  appVersion: z.string(),
  /** Records per module in the file. */
  counts: z.object({
    weights: z.number(),
    measurements: z.number(),
    foodLogs: z.number(),
    workouts: z.number(),
    cardio: z.number(),
    sleep: z.number(),
    habitLogs: z.number(),
  }),
  /** The same profile (same id) on this computer: none, in use or archived. */
  existing: z.object({ name: z.string(), archived: z.boolean() }).nullable(),
});

export const transferTokenInputSchema = z.object({ token: z.string() });

export const transferImportResultSchema = z.object({
  profileId: z.string(),
  /** True when an existing profile was replaced (after a backup). */
  replaced: z.boolean(),
});

export type TransferPreview = z.infer<typeof transferPreviewSchema>;
export type TransferImportResult = z.infer<typeof transferImportResultSchema>;
