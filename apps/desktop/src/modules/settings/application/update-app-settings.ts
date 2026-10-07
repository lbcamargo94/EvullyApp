import type { AppSettings, UpdateAppSettingsInput } from '@evully/contracts';
import type { SettingsRepository } from '../ports/settings-repository';
import { GetAppSettings } from './get-app-settings';
import { SETTING_KEYS } from './setting-keys';

export class UpdateAppSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(input: UpdateAppSettingsInput): Promise<AppSettings> {
    if (input.inactivityLockMinutes !== undefined) {
      await this.settings.set(
        null,
        SETTING_KEYS.inactivityLockMinutes,
        input.inactivityLockMinutes,
      );
    }
    return new GetAppSettings(this.settings).execute();
  }
}
