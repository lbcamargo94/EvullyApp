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

const cell = z.union([z.string(), z.number(), z.null()]);
const row = z.record(z.string(), cell);

/** `manifest.json` of a profile transfer zip. */
export const transferManifestSchema = z.object({
  format: z.string(),
  formatVersion: z.number().int(),
  appVersion: z.string(),
  /** Latest migration of the database that wrote the file. */
  schemaVersion: z.string(),
  createdAt: z.string(),
  profileId: z.string(),
  profileName: z.string(),
  /** SHA-256 of `profile.json`. */
  sha256: z.string(),
});

/** `profile.json`: the JSON export of README §14.3, as raw table rows. */
export const transferDocumentSchema = z.object({
  format: z.literal('evully-profile-export'),
  appVersion: z.string(),
  exportedAt: z.string(),
  profile: z.object({ id: z.string(), name: z.string() }).catchall(cell),
  data: z.record(z.string(), z.array(row)),
});

export type TransferPreview = z.infer<typeof transferPreviewSchema>;
export type TransferManifest = z.infer<typeof transferManifestSchema>;
export type TransferDocument = z.infer<typeof transferDocumentSchema>;
export type TransferImportResult = z.infer<typeof transferImportResultSchema>;
