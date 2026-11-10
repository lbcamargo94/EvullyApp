import { ValidationError } from '../errors';
import { daysBetween, type LocalDate } from '../local-date';

export type BackupKind = 'manual' | 'automatic' | 'pre-migration' | 'pre-delete' | 'pre-restore';

/** Automatic copies kept per folder (README §8.7.2). */
export const AUTOMATIC_BACKUPS_TO_KEEP = 10;

/** `evully-backup-YYYY-MM-DD-HHMM.zip`, with `-2`, `-3`… if the name is taken. */
export function backupFileName(
  date: LocalDate,
  time: string,
  taken: ReadonlySet<string> = new Set(),
): string {
  const base = `evully-backup-${date}-${time.replace(':', '')}`;
  let name = `${base}.zip`;
  for (let n = 2; taken.has(name); n++) name = `${base}-${n}.zip`;
  return name;
}

/** At most one automatic backup per day, and only when enabled. */
export function isAutomaticBackupDue(
  enabled: boolean,
  lastAutomaticOn: LocalDate | null,
  today: LocalDate,
): boolean {
  return enabled && (lastAutomaticOn === null || daysBetween(lastAutomaticOn, today) > 0);
}

export interface StoredBackup {
  fileName: string;
  /** Null when the archive has no readable manifest; such files are never deleted. */
  kind: BackupKind | null;
  createdAt: string;
}

/**
 * Automatic backups beyond the newest `keep`. Manual, pre-migration,
 * pre-delete and pre-restore backups, and files without a manifest, are
 * never selected.
 */
export function backupsToDelete(
  backups: readonly StoredBackup[],
  keep: number = AUTOMATIC_BACKUPS_TO_KEEP,
): string[] {
  return backups
    .filter((b) => b.kind === 'automatic')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(keep)
    .map((b) => b.fileName);
}

/**
 * A backup can be restored (README §14.2) when its database is the one the
 * manifest describes and its schema is not newer than the app's. Schema
 * versions are migration names (`0018_sleep_targets`), which sort in order.
 */
export function assertRestorable(backup: {
  manifestSha256: string;
  actualSha256: string;
  integrityOk: boolean;
  schemaVersion: string;
  appSchemaVersion: string;
}): void {
  if (backup.manifestSha256 !== backup.actualSha256 || !backup.integrityOk) {
    throw new ValidationError('backup.restore_corrupt', 'The backup database is damaged');
  }
  if (backup.schemaVersion > backup.appSchemaVersion) {
    throw new ValidationError('backup.restore_newer', 'The backup is from a newer Evully');
  }
}
