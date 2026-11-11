import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  ConfirmProfileImport,
  ExportTransfer,
  PendingTransfer,
  PrepareProfileImport,
  type TransferDeps,
} from '../application/profile-transfer';

type TransferChannels =
  'transfer:export' | 'transfer:prepare-import' | 'transfer:import' | 'transfer:cancel';

export function transferIpcHandlers(deps: TransferDeps): Pick<IpcHandlers, TransferChannels> {
  const pending = new PendingTransfer();
  const exportTransfer = new ExportTransfer(deps);
  const prepare = new PrepareProfileImport(deps, pending);
  const confirm = new ConfirmProfileImport(deps, pending);
  return {
    'transfer:export': (input) => exportTransfer.execute(input),
    'transfer:prepare-import': () => prepare.execute(),
    'transfer:import': (input) => confirm.execute(input),
    'transfer:cancel': ({ token }) => {
      pending.discard(token);
      return null;
    },
  };
}
