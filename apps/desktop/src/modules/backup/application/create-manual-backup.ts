import type { BackupResult } from '@evully/contracts';
import { backupFileName } from '@evully/domain';
import type { BackupDialogs } from '../ports/backup-ports';
import type { BackupDeps } from './create-backup';

/**
 * "Fazer backup agora": the user picks where to save (README §8.7.1). The
 * native save dialog asks before replacing an existing file. Null if cancelled.
 */
export class CreateManualBackup {
  constructor(
    private readonly deps: BackupDeps,
    private readonly dialogs: BackupDialogs,
  ) {}

  async execute(): Promise<BackupResult | null> {
    const { writer, settings, clock, appVersion } = this.deps;
    const path = await this.dialogs.chooseSavePath(
      backupFileName(clock.today(), clock.localTime()),
    );
    if (!path) return null;
    const createdAt = clock.nowIso();
    await writer.write(path, { appVersion, kind: 'manual', createdAt });
    const fileName = path.split(/[\\/]/).at(-1) ?? path;
    await settings.recordBackup(createdAt, 'manual', fileName);
    return { fileName, createdAt };
  }
}
