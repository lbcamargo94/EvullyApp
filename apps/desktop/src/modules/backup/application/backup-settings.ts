import { backupStatusSchema, type BackupKind, type BackupStatus } from '@evully/contracts';
import { parseLocalDate, type LocalDate } from '@evully/domain';
import type { SettingsRepository } from '../../settings/ports/settings-repository';

const KEYS = {
  automaticEnabled: 'backup_automatic_enabled',
  extraDirectory: 'backup_extra_directory',
  lastBackup: 'backup_last',
  lastAutomaticOn: 'backup_last_automatic_on',
  lastError: 'backup_last_error',
} as const;

const statusFields = backupStatusSchema.shape;

/** Typed access to the global backup settings; invalid stored values read as defaults. */
export class BackupSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async automaticEnabled(): Promise<boolean> {
    const parsed = statusFields.automaticEnabled.safeParse(
      await this.settings.get(null, KEYS.automaticEnabled),
    );
    return parsed.success ? parsed.data : true;
  }

  setAutomaticEnabled(enabled: boolean): Promise<void> {
    return this.settings.set(null, KEYS.automaticEnabled, enabled);
  }

  async extraDirectory(): Promise<string | null> {
    const parsed = statusFields.extraDirectory.safeParse(
      await this.settings.get(null, KEYS.extraDirectory),
    );
    return parsed.success ? parsed.data : null;
  }

  setExtraDirectory(directory: string | null): Promise<void> {
    return this.settings.set(null, KEYS.extraDirectory, directory);
  }

  async lastBackup(): Promise<BackupStatus['lastBackup']> {
    const parsed = statusFields.lastBackup.safeParse(
      await this.settings.get(null, KEYS.lastBackup),
    );
    return parsed.success ? parsed.data : null;
  }

  recordBackup(at: string, kind: BackupKind, fileName: string): Promise<void> {
    return this.settings.set(null, KEYS.lastBackup, { at, kind, fileName });
  }

  async lastAutomaticOn(): Promise<LocalDate | null> {
    const value = await this.settings.get(null, KEYS.lastAutomaticOn);
    try {
      return typeof value === 'string' ? parseLocalDate(value) : null;
    } catch {
      return null;
    }
  }

  setLastAutomaticOn(date: LocalDate): Promise<void> {
    return this.settings.set(null, KEYS.lastAutomaticOn, date);
  }

  async lastError(): Promise<BackupStatus['lastError']> {
    const parsed = statusFields.lastError.safeParse(await this.settings.get(null, KEYS.lastError));
    return parsed.success ? parsed.data : null;
  }

  setLastError(error: BackupStatus['lastError']): Promise<void> {
    return this.settings.set(null, KEYS.lastError, error);
  }
}
