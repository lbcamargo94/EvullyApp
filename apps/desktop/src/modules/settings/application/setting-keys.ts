import type { AppSettings } from '@evully/contracts';

export const SETTING_KEYS = {
  healthNoticeAcceptedAt: 'health_notice_accepted_at',
  inactivityLockMinutes: 'inactivity_lock_minutes',
} as const;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  healthNoticeAcceptedAt: null,
  inactivityLockMinutes: 15,
};
