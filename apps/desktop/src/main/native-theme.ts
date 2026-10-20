import type { AppSettings } from '@evully/contracts';
import { nativeTheme } from 'electron';
import type { IpcHandlers } from '../shared/ipc-channels';

const apply = (settings: AppSettings) => {
  nativeTheme.themeSource = settings.theme;
  return settings;
};

/**
 * Keeps the Windows title bar and native dialogs in the theme chosen in
 * Settings › Geral; the renderer applies the same choice to the page.
 */
export function withNativeTheme(handlers: IpcHandlers): IpcHandlers {
  return {
    ...handlers,
    'settings:get': async (input) => apply(await handlers['settings:get'](input)),
    'settings:update': async (input) => apply(await handlers['settings:update'](input)),
  };
}
