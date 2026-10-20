import type { AppSettings } from '@evully/contracts';

export const SETTING_KEYS = {
  healthNoticeAcceptedAt: 'health_notice_accepted_at',
  inactivityLockMinutes: 'inactivity_lock_minutes',
  theme: 'theme',
} as const satisfies Record<keyof AppSettings, string>;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  healthNoticeAcceptedAt: null,
  inactivityLockMinutes: 15,
  theme: 'system',
};
