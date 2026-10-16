import type { BackupKind, BackupResult } from '@evully/contracts';
import { backupFileName } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { BackupFolder, BackupWriter } from '../ports/backup-ports';
import type { BackupSettings } from './backup-settings';

export interface BackupDeps {
  writer: BackupWriter;
  folder: BackupFolder;
  settings: BackupSettings;
  clock: Clock;
  appVersion: string;
}

/** Writes a backup zip into `directory` with a name that does not overwrite existing files. */
export class CreateBackup {
  constructor(private readonly deps: BackupDeps) {}

  async execute({
    kind,
    directory,
  }: {
    kind: BackupKind;
    directory: string;
  }): Promise<BackupResult & { path: string }> {
    const { writer, folder, settings, clock, appVersion } = this.deps;
    await folder.ensure(directory);
    const taken = new Set((await folder.list(directory)).map((b) => b.fileName));
    const fileName = backupFileName(clock.today(), clock.localTime(), taken);
    const path = folder.join(directory, fileName);
    const createdAt = clock.nowIso();
    await writer.write(path, { appVersion, kind, createdAt });
    await settings.recordBackup(createdAt, kind, fileName);
    return { fileName, createdAt, path };
  }
}
