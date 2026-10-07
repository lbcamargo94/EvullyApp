import type { AppSettings } from '@evully/contracts';
import type { Clock } from '../../shared/ports';
import type { SettingsRepository } from '../ports/settings-repository';
import { GetAppSettings } from './get-app-settings';
import { SETTING_KEYS } from './setting-keys';

/** Records that the health notice was confirmed on this installation (README §8.1). */
export class AcceptHealthNotice {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<AppSettings> {
    await this.settings.set(null, SETTING_KEYS.healthNoticeAcceptedAt, this.clock.nowIso());
    return new GetAppSettings(this.settings).execute();
  }
}
