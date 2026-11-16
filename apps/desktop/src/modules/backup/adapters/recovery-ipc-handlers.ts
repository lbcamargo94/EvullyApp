import type { IpcHandlers } from '../../../shared/ipc-channels';
import { ConfirmRecovery, type RecoveryDeps } from '../application/recover-database';
import {
  ListRestorableBackups,
  PendingRestore,
  PrepareRestore,
} from '../application/restore-backup';

type RecoveryChannels =
  'recovery:status' | 'backup:restorable' | 'backup:prepare-restore' | 'backup:restore';

/**
 * The restore channels in recovery mode (README §14.2.1): same listing and
 * validation as "Restaurar backup", but the damaged database is kept as a copy
 * instead of backed up. The renderer uses the same restore screen.
 */
export function recoveryIpcHandlers(deps: RecoveryDeps): Pick<IpcHandlers, RecoveryChannels> {
  const pending = new PendingRestore(deps.reader);
  return {
    'recovery:status': () => ({ damaged: true }),
    'backup:restorable': () => new ListRestorableBackups(deps).execute(),
    'backup:prepare-restore': (input) => new PrepareRestore(deps, pending).execute(input),
    'backup:restore': (input) => new ConfirmRecovery(deps, pending).execute(input),
  };
}
