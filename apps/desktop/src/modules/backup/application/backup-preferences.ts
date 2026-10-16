import type { BackupStatus } from '@evully/contracts';
import type { BackupDialogs } from '../ports/backup-ports';
import type { BackupSettings } from './backup-settings';

export class GetBackupStatus {
  constructor(
    private readonly settings: BackupSettings,
    private readonly defaultDirectory: string,
  ) {}

  async execute(): Promise<BackupStatus> {
    return {
      lastBackup: await this.settings.lastBackup(),
      lastError: await this.settings.lastError(),
      automaticEnabled: await this.settings.automaticEnabled(),
      extraDirectory: await this.settings.extraDirectory(),
      defaultDirectory: this.defaultDirectory,
    };
  }
}

/** Turns the automatic backup on or off. */
export class SetAutomaticBackup {
  constructor(private readonly settings: BackupSettings) {}

  execute({ automaticEnabled }: { automaticEnabled: boolean }): Promise<void> {
    return this.settings.setAutomaticEnabled(automaticEnabled);
  }
}

/** Picks (or clears, with `clear: true`) the extra folder for automatic copies. */
export class ChooseExtraBackupDirectory {
  constructor(
    private readonly settings: BackupSettings,
    private readonly dialogs: BackupDialogs,
  ) {}

  async execute({ clear }: { clear: boolean }): Promise<void> {
    if (clear) return this.settings.setExtraDirectory(null);
    const directory = await this.dialogs.chooseDirectory();
    if (directory) await this.settings.setExtraDirectory(directory);
  }
}

/** Hides the "last automatic backup failed" notice. */
export class DismissBackupError {
  constructor(private readonly settings: BackupSettings) {}

  execute(): Promise<void> {
    return this.settings.setLastError(null);
  }
}
