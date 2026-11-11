import { z } from 'zod';

export const backupKindSchema = z.enum([
  'manual',
  'automatic',
  'pre-migration',
  'pre-delete',
  'pre-restore',
  'pre-import',
]);

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

// ------------------------------------------------------------ restore (README §14.2)

export const backupFolderSchema = z.enum(['default', 'extra']);

/** Evully backups found in the default and the extra folder, newest first. */
export const restorableBackupsSchema = z.array(
  z.object({
    folder: backupFolderSchema,
    fileName: z.string(),
    kind: backupKindSchema,
    createdAt: z.string(),
  }),
);

/** A listed backup by folder and file name, or one picked in the open dialog; never a path. */
export const prepareRestoreInputSchema = z.discriminatedUnion('from', [
  z.object({
    from: z.literal('list'),
    folder: backupFolderSchema,
    fileName: z.string().regex(/^[^\\/:]+\.zip$/i),
  }),
  z.object({ from: z.literal('dialog') }),
]);

/** What a validated backup holds, shown before the user confirms. */
export const restorePreviewSchema = z.object({
  token: z.string(),
  fileName: z.string(),
  createdAt: z.string(),
  kind: backupKindSchema,
  appVersion: z.string(),
  /** Names of the profiles in the backup. */
  profiles: z.array(z.string()),
});

export const restoreInputSchema = z.object({ token: z.string() });

export type BackupKind = z.infer<typeof backupKindSchema>;
export type BackupStatus = z.infer<typeof backupStatusSchema>;
export type BackupResult = z.infer<typeof backupResultSchema>;
export type BackupFolderName = z.infer<typeof backupFolderSchema>;
export type RestorableBackups = z.infer<typeof restorableBackupsSchema>;
export type PrepareRestoreInput = z.infer<typeof prepareRestoreInputSchema>;
export type RestorePreview = z.infer<typeof restorePreviewSchema>;
