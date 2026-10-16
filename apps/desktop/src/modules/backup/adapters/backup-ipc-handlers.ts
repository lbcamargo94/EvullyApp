import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  ChooseExtraBackupDirectory,
  DismissBackupError,
  GetBackupStatus,
  SetAutomaticBackup,
} from '../application/backup-preferences';
import type { BackupSettings } from '../application/backup-settings';
import type { BackupDeps } from '../application/create-backup';
import { CreateManualBackup } from '../application/create-manual-backup';
import type { BackupDialogs } from '../ports/backup-ports';

type BackupChannels =
  | 'backup:status'
  | 'backup:create-manual'
  | 'backup:set-automatic'
  | 'backup:choose-extra-directory'
  | 'backup:dismiss-error';

export function backupIpcHandlers(deps: {
  backup: BackupDeps;
  settings: BackupSettings;
  dialogs: BackupDialogs;
  defaultDirectory: string;
}): Pick<IpcHandlers, BackupChannels> {
  const status = new GetBackupStatus(deps.settings, deps.defaultDirectory);
  const manual = new CreateManualBackup(deps.backup, deps.dialogs);
  const setAutomatic = new SetAutomaticBackup(deps.settings);
  const chooseExtra = new ChooseExtraBackupDirectory(deps.settings, deps.dialogs);
  const dismiss = new DismissBackupError(deps.settings);
  const thenStatus = async (run: Promise<unknown>) => {
    await run;
    return status.execute();
  };
  return {
    'backup:status': () => status.execute(),
    'backup:create-manual': () => manual.execute(),
    'backup:set-automatic': (input) => thenStatus(setAutomatic.execute(input)),
    'backup:choose-extra-directory': (input) => thenStatus(chooseExtra.execute(input)),
    'backup:dismiss-error': () => thenStatus(dismiss.execute()),
  };
}
