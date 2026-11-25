import type { AppSettings } from '@evully/contracts';
import type { IpcHandlers } from '../shared/ipc-channels';
import { applyStartWithWindows } from './reminders-shell';

const apply = (settings: AppSettings) => {
  applyStartWithWindows(settings.startWithWindows);
  return settings;
};

/** Keeps the Windows login item in line with Settings › Lembretes (README §25). */
export function withStartWithWindows(handlers: IpcHandlers): IpcHandlers {
  return {
    ...handlers,
    'settings:update': async (input) => apply(await handlers['settings:update'](input)),
  };
}
