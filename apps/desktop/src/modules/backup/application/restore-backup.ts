import type {
  BackupFolderName,
  PrepareRestoreInput,
  RestorableBackups,
  RestorePreview,
} from '@evully/contracts';
import { assertRestorable, NotFoundError } from '@evully/domain';
import type { IdGenerator } from '../../shared/ports';
import type { AppRestart, BackupDialogs, BackupReader } from '../ports/backup-ports';
import { CreateBackup, type BackupDeps } from './create-backup';

export interface RestoreDeps {
  backup: BackupDeps;
  reader: BackupReader;
  dialogs: BackupDialogs;
  restart: AppRestart;
  ids: IdGenerator;
  defaultDirectory: string;
  /** Latest migration this app knows. */
  appSchemaVersion: string;
}

/** The one backup validated and waiting for confirmation; paths never leave the main process. */
export class PendingRestore {
  private item: { token: string; databaseFile: string } | null = null;

  constructor(private readonly reader: BackupReader) {}

  async put(token: string, databaseFile: string): Promise<void> {
    await this.clear();
    this.item = { token, databaseFile };
  }

  take(token: string): string {
    if (!this.item || this.item.token !== token) {
      throw new NotFoundError('backup.restore_expired', 'Restore preview not found');
    }
    const { databaseFile } = this.item;
    this.item = null;
    return databaseFile;
  }

  async clear(): Promise<void> {
    if (this.item) await this.reader.discard(this.item.databaseFile);
    this.item = null;
  }
}

async function directories(deps: RestoreDeps): Promise<Record<BackupFolderName, string | null>> {
  return { default: deps.defaultDirectory, extra: await deps.backup.settings.extraDirectory() };
}

/** Evully backups in the default and the extra folder, newest first (README §14.2). */
export class ListRestorableBackups {
  constructor(private readonly deps: RestoreDeps) {}

  async execute(): Promise<RestorableBackups> {
    const { folder } = this.deps.backup;
    const found: RestorableBackups = [];
    for (const [name, directory] of Object.entries(await directories(this.deps))) {
      if (!directory) continue;
      for (const b of await folder.list(directory)) {
        if (b.kind) {
          found.push({
            folder: name as BackupFolderName,
            fileName: b.fileName,
            kind: b.kind,
            createdAt: b.createdAt,
          });
        }
      }
    }
    return found.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}

/**
 * Validates a backup (README §14.2, SECURITY.md §2.3): manifest, sha256,
 * `PRAGMA integrity_check` and a schema not newer than the app's. Returns
 * what it holds; null when the dialog is cancelled.
 */
export class PrepareRestore {
  constructor(
    private readonly deps: RestoreDeps,
    private readonly pending: PendingRestore,
  ) {}

  async execute(input: PrepareRestoreInput): Promise<RestorePreview | null> {
    const path = await this.resolve(input);
    if (!path) return null;
    const { reader, ids, appSchemaVersion } = this.deps;
    const opened = await reader.open(path);
    try {
      assertRestorable({
        manifestSha256: opened.manifest.sha256,
        actualSha256: opened.sha256,
        integrityOk: opened.integrityOk,
        schemaVersion: opened.schemaVersion,
        appSchemaVersion,
      });
    } catch (error) {
      await reader.discard(opened.databaseFile);
      throw error;
    }
    const token = ids.next();
    await this.pending.put(token, opened.databaseFile);
    const { createdAt, kind, appVersion } = opened.manifest;
    return {
      token,
      fileName: path.split(/[\\/]/).at(-1) ?? path,
      createdAt,
      kind,
      appVersion,
      profiles: opened.profiles,
    };
  }

  /** Only a file listed in one of the backup folders, or one picked in the dialog. */
  private async resolve(input: PrepareRestoreInput): Promise<string | null> {
    if (input.from === 'dialog') return this.deps.dialogs.chooseBackupFile();
    const { folder } = this.deps.backup;
    const directory = (await directories(this.deps))[input.folder];
    const listed = directory ? await folder.list(directory) : [];
    if (!directory || !listed.some((b) => b.fileName === input.fileName && b.kind)) {
      throw new NotFoundError('backup.restore_not_found', 'Backup not found');
    }
    return folder.join(directory, input.fileName);
  }
}

/**
 * Backs up the current data (`pre-restore`), stages the validated database
 * and restarts; the swap happens on the next start, before the database opens.
 */
export class ConfirmRestore {
  constructor(
    private readonly deps: RestoreDeps,
    private readonly pending: PendingRestore,
  ) {}

  async execute({ token }: { token: string }): Promise<null> {
    const databaseFile = this.pending.take(token);
    try {
      await new CreateBackup(this.deps.backup).execute({
        kind: 'pre-restore',
        directory: this.deps.defaultDirectory,
      });
      await this.deps.reader.stage(databaseFile);
    } catch (error) {
      await this.deps.reader.discard(databaseFile);
      throw error;
    }
    this.deps.restart.restart();
    return null;
  }
}
