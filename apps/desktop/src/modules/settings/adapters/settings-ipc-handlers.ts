import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { Clock } from '../../shared/ports';
import { AcceptHealthNotice } from '../application/accept-health-notice';
import { GetAppSettings } from '../application/get-app-settings';
import { UpdateAppSettings } from '../application/update-app-settings';
import type { SettingsRepository } from '../ports/settings-repository';

type SettingsChannels = 'settings:get' | 'settings:update' | 'settings:accept-health-notice';

export function settingsIpcHandlers(
  settings: SettingsRepository,
  clock: Clock,
): Pick<IpcHandlers, SettingsChannels> {
  const get = new GetAppSettings(settings);
  const update = new UpdateAppSettings(settings);
  const accept = new AcceptHealthNotice(settings, clock);
  return {
    'settings:get': () => get.execute(),
    'settings:update': (input) => update.execute(input),
    'settings:accept-health-notice': () => accept.execute(),
  };
}
