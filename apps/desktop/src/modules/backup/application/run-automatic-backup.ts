import { backupsToDelete, isAutomaticBackupDue } from '@evully/domain';
import type { BackupFolder } from '../ports/backup-ports';
import { CreateBackup, type BackupDeps } from './create-backup';

/**
 * Automatic backup when the app closes (README §8.7.2): once per day, a copy in
 * the extra folder when set, the last 10 automatic copies kept in each folder.
 * Never throws: a failure is recorded and shown on the next start.
 */
export class RunAutomaticBackup {
  constructor(
    private readonly deps: BackupDeps,
    private readonly defaultDirectory: string,
  ) {}

  async execute(): Promise<'done' | 'skipped' | 'failed'> {
    const { settings, clock, folder } = this.deps;
    try {
      const today = clock.today();
      if (
        !isAutomaticBackupDue(
          await settings.automaticEnabled(),
          await settings.lastAutomaticOn(),
          today,
        )
      ) {
        return 'skipped';
      }
      const backup = await new CreateBackup(this.deps).execute({
        kind: 'automatic',
        directory: this.defaultDirectory,
      });
      await prune(folder, this.defaultDirectory);

      const extra = await settings.extraDirectory();
      if (extra) {
        await folder.ensure(extra);
        await folder.copy(backup.path, extra, backup.fileName);
        await prune(folder, extra);
      }
      await settings.setLastAutomaticOn(today);
      await settings.setLastError(null);
      return 'done';
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : 'backup.failed';
      await settings.setLastError({ at: clock.nowIso(), code }).catch(() => undefined);
      return 'failed';
    }
  }
}

async function prune(folder: BackupFolder, directory: string): Promise<void> {
  for (const fileName of backupsToDelete(await folder.list(directory))) {
    await folder.remove(directory, fileName);
  }
}
