/** Key/value settings, global (`profileId` null) or per profile (README §8.3). */
export interface SettingsRepository {
  get(profileId: string | null, key: string): Promise<unknown>;
  set(profileId: string | null, key: string, value: unknown): Promise<void>;
}
