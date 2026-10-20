import type { AppSettings, UpdateAppSettingsInput } from '@evully/contracts';
import type { SettingsRepository } from '../ports/settings-repository';
import { GetAppSettings } from './get-app-settings';
import { SETTING_KEYS } from './setting-keys';

export class UpdateAppSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(input: UpdateAppSettingsInput): Promise<AppSettings> {
    for (const [key, value] of Object.entries(input) as [keyof UpdateAppSettingsInput, unknown][]) {
      if (value !== undefined) await this.settings.set(null, SETTING_KEYS[key], value);
    }
    return new GetAppSettings(this.settings).execute();
  }
}
