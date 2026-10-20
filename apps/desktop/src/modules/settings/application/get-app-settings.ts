import { appSettingsSchema, type AppSettings } from '@evully/contracts';
import type { SettingsRepository } from '../ports/settings-repository';
import { DEFAULT_APP_SETTINGS, SETTING_KEYS } from './setting-keys';

const KEYS = Object.keys(SETTING_KEYS) as (keyof AppSettings)[];

export class GetAppSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(): Promise<AppSettings> {
    const values: Record<string, unknown> = {};
    for (const key of KEYS) {
      const stored = await this.settings.get(null, SETTING_KEYS[key]);
      // Each value is checked on its own: an unknown or corrupted one falls
      // back to its default without resetting the others.
      const parsed = appSettingsSchema.shape[key].safeParse(stored);
      values[key] = parsed.success ? parsed.data : DEFAULT_APP_SETTINGS[key];
    }
    return values as AppSettings;
  }
}
