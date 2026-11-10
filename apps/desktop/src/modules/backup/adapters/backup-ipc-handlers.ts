import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  ChooseExtraBackupDirectory,
  DismissBackupError,
  GetBackupStatus,
  SetAutomaticBackup,
} from '../application/backup-preferences';
import type { BackupSettings } from '../application/backup-settings';
import { CreateManualBackup } from '../application/create-manual-backup';
import {
  ConfirmRestore,
  ListRestorableBackups,
  PendingRestore,
  PrepareRestore,
  type RestoreDeps,
} from '../application/restore-backup';

type BackupChannels =
  | 'backup:status'
  | 'backup:create-manual'
  | 'backup:set-automatic'
  | 'backup:choose-extra-directory'
  | 'backup:dismiss-error'
  | 'backup:restorable'
  | 'backup:prepare-restore'
  | 'backup:restore';

export function backupIpcHandlers(
  deps: RestoreDeps & { settings: BackupSettings },
): Pick<IpcHandlers, BackupChannels> {
  const status = new GetBackupStatus(deps.settings, deps.defaultDirectory);
  const manual = new CreateManualBackup(deps.backup, deps.dialogs);
  const setAutomatic = new SetAutomaticBackup(deps.settings);
  const chooseExtra = new ChooseExtraBackupDirectory(deps.settings, deps.dialogs);
  const dismiss = new DismissBackupError(deps.settings);
  const pending = new PendingRestore(deps.reader);
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
    'backup:restorable': () => new ListRestorableBackups(deps).execute(),
    'backup:prepare-restore': (input) => new PrepareRestore(deps, pending).execute(input),
    'backup:restore': (input) => new ConfirmRestore(deps, pending).execute(input),
  };
}
