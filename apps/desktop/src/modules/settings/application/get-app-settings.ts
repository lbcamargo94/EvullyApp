import { appSettingsSchema, type AppSettings } from '@evully/contracts';
import type { SettingsRepository } from '../ports/settings-repository';
import { DEFAULT_APP_SETTINGS, SETTING_KEYS } from './setting-keys';

export class GetAppSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(): Promise<AppSettings> {
    const stored = {
      healthNoticeAcceptedAt: await this.settings.get(null, SETTING_KEYS.healthNoticeAcceptedAt),
      inactivityLockMinutes: await this.settings.get(null, SETTING_KEYS.inactivityLockMinutes),
    };
    // Unknown or corrupted values fall back to defaults instead of breaking startup.
    const parsed = appSettingsSchema.partial().safeParse(stored);
    const values = parsed.success ? parsed.data : {};
    return {
      healthNoticeAcceptedAt:
        values.healthNoticeAcceptedAt ?? DEFAULT_APP_SETTINGS.healthNoticeAcceptedAt,
      inactivityLockMinutes:
        values.inactivityLockMinutes ?? DEFAULT_APP_SETTINGS.inactivityLockMinutes,
    };
  }
}
