import { app } from 'electron';
import { join } from 'node:path';

/**
 * Development uses a separate data folder so seeds and experiments never touch
 * real data (README §5.4). Must run before the app is ready.
 */
export function configureDataDirectory(): void {
  if (app.isPackaged) return;
  // End-to-end tests give each run an empty folder; ignored in the installed app.
  const e2eDir = process.env['EVULLY_DATA_DIR'];
  app.setPath('userData', e2eDir ? e2eDir : join(app.getPath('appData'), 'Evully-dev'));
}

export function databaseFile(): string {
  return join(app.getPath('userData'), 'evully.db');
}

/** Default folder for automatic and pre-migration backups (README §5.4). */
export function backupsDirectory(): string {
  return join(app.getPath('userData'), 'backups');
}

/** A validated backup waiting to replace the database on the next start (README §14.2). */
export function pendingRestoreFile(): string {
  return join(app.getPath('userData'), 'restore-pending.db');
}

/** Private scratch folder for database snapshots while a backup is written. */
export function scratchDirectory(): string {
  return join(app.getPath('userData'), 'tmp');
}
