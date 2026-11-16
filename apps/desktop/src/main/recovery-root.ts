import type { AppInfo, LegalDocuments } from '@evully/contracts';
import { ValidationError } from '@evully/domain';
import { LATEST_MIGRATION } from '../database/migrator';
import { FsBackupFolder } from '../modules/backup/adapters/fs-backup';
import { FsBackupReader } from '../modules/backup/adapters/fs-backup-reader';
import { FsDamagedDatabase } from '../modules/backup/adapters/fs-damaged-database';
import { recoveryIpcHandlers } from '../modules/backup/adapters/recovery-ipc-handlers';
import type { AppRestart, BackupDialogs } from '../modules/backup/ports/backup-ports';
import type { Clock, IdGenerator } from '../modules/shared/ports';
import { ipcChannels, type IpcHandlers } from '../shared/ipc-channels';

interface RecoveryDependencies {
  databaseFile: string;
  clock: Clock;
  ids: IdGenerator;
  appInfo: () => AppInfo;
  legal: () => Promise<LegalDocuments>;
  openLogs: () => Promise<null>;
  backup: {
    defaultDirectory: string;
    tempDirectory: string;
    pendingRestoreFile: string;
    dialogs: BackupDialogs;
    restart: AppRestart;
  };
}

/**
 * Recovery mode (README §14.2.1): the database is damaged and is never
 * opened. Only app info, logs and the restore channels work; every other
 * channel answers `app.recovery_mode`.
 */
export function buildRecovery(deps: RecoveryDependencies): IpcHandlers {
  const unavailable = () =>
    Promise.reject(new ValidationError('app.recovery_mode', 'The database is damaged'));
  const closed = Object.fromEntries(
    Object.keys(ipcChannels).map((channel) => [channel, unavailable]),
  ) as unknown as IpcHandlers;
  const { backup } = deps;
  return {
    ...closed,
    'app:info': deps.appInfo,
    'app:legal': deps.legal,
    'app:open-logs': deps.openLogs,
    ...recoveryIpcHandlers({
      folder: new FsBackupFolder(),
      extraDirectory: () => Promise.resolve(null),
      reader: new FsBackupReader(backup.tempDirectory, backup.pendingRestoreFile),
      dialogs: backup.dialogs,
      restart: backup.restart,
      ids: deps.ids,
      defaultDirectory: backup.defaultDirectory,
      appSchemaVersion: LATEST_MIGRATION,
      damaged: new FsDamagedDatabase(deps.databaseFile),
      clock: deps.clock,
    }),
  };
}
