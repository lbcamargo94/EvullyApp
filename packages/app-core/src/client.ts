import type {
  AppInfo,
  AppSettings,
  ProfileDto,
  ProfileInput,
  ProfileSummary,
  UpdateAppSettingsInput,
  UpdateProfileInput,
} from '@evully/contracts';

/**
 * Data port for the screens (FRONTEND.md §3.2). Each platform provides an
 * implementation: IPC on desktop, HTTP on web, local SQLite + sync on mobile.
 * Failures reject with an error carrying a stable `code`.
 */
export interface EvullyClient {
  app: {
    info(): Promise<AppInfo>;
  };
  profiles: {
    list(): Promise<ProfileSummary[]>;
    get(id: string): Promise<ProfileDto>;
    create(input: ProfileInput): Promise<ProfileDto>;
    update(input: UpdateProfileInput): Promise<ProfileDto>;
  };
  settings: {
    get(): Promise<AppSettings>;
    update(input: UpdateAppSettingsInput): Promise<AppSettings>;
    acceptHealthNotice(): Promise<AppSettings>;
  };
}

/** Stable error code of a failed client call, if any. */
export function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}
