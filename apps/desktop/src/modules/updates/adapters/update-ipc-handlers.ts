import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { Updater } from '../ports/updater';

type UpdateChannels = 'updates:status' | 'updates:check' | 'updates:install';

export function updateIpcHandlers(updater: Updater): Pick<IpcHandlers, UpdateChannels> {
  return {
    'updates:status': () => updater.status(),
    'updates:check': () => updater.check(),
    'updates:install': () => updater.install(),
  };
}
