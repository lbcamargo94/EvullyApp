import { z } from 'zod';

export const backupKindSchema = z.enum(['manual', 'automatic', 'pre-migration', 'pre-delete']);

/** State shown in Settings › Backup (README §8.7). Paths are chosen in the main process only. */
export const backupStatusSchema = z.object({
  lastBackup: z.object({ at: z.string(), kind: backupKindSchema, fileName: z.string() }).nullable(),
  /** Error of the last automatic backup, until the user dismisses it. */
  lastError: z.object({ at: z.string(), code: z.string() }).nullable(),
  automaticEnabled: z.boolean(),
  extraDirectory: z.string().nullable(),
  defaultDirectory: z.string(),
});

export const backupResultSchema = z.object({ fileName: z.string(), createdAt: z.string() });

export const updateBackupSettingsInputSchema = z.object({ automaticEnabled: z.boolean() });

export type BackupKind = z.infer<typeof backupKindSchema>;
export type BackupStatus = z.infer<typeof backupStatusSchema>;
export type BackupResult = z.infer<typeof backupResultSchema>;
