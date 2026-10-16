import { backupKindSchema } from '@evully/contracts';
import type { StoredBackup } from '@evully/domain';
import AdmZip from 'adm-zip';
import { sql, type Kysely } from 'kysely';
import { createHash, randomUUID } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { DatabaseSchema } from '../../../database/schema';
import type { BackupFolder, BackupManifest, BackupWriter } from '../ports/backup-ports';

const DB_ENTRY = 'evully.db';
const MANIFEST_ENTRY = 'manifest.json';

export class FsBackupWriter implements BackupWriter {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    /** Private scratch folder inside the app data directory, never a shared temp folder. */
    private readonly tempDirectory: string,
  ) {}

  async write(
    targetPath: string,
    meta: Pick<BackupManifest, 'appVersion' | 'kind' | 'createdAt'>,
  ): Promise<BackupManifest> {
    await mkdir(this.tempDirectory, { recursive: true });
    const snapshot = join(this.tempDirectory, `${randomUUID()}.db`);
    try {
      // VACUUM INTO produces a consistent copy of the live database (README §8.7.1).
      await sql`VACUUM INTO ${snapshot}`.execute(this.db);
      const bytes = await readFile(snapshot);
      const manifest: BackupManifest = {
        ...meta,
        schemaVersion: await this.schemaVersion(),
        sha256: createHash('sha256').update(bytes).digest('hex'),
      };
      const zip = new AdmZip();
      zip.addFile(DB_ENTRY, bytes);
      zip.addFile(MANIFEST_ENTRY, Buffer.from(JSON.stringify(manifest, null, 2)));
      await zip.writeZipPromise(targetPath, { overwrite: true });
      return manifest;
    } finally {
      await rm(snapshot, { force: true });
    }
  }

  private async schemaVersion(): Promise<string> {
    const { rows } = await sql<{ name: string }>`
      SELECT name FROM kysely_migration ORDER BY name DESC LIMIT 1
    `.execute(this.db);
    return rows[0]?.name ?? 'none';
  }
}

export class FsBackupFolder implements BackupFolder {
  async ensure(directory: string): Promise<void> {
    await mkdir(directory, { recursive: true });
  }

  async list(directory: string): Promise<StoredBackup[]> {
    let names: string[];
    try {
      names = (await readdir(directory)).filter((n) => n.toLowerCase().endsWith('.zip'));
    } catch {
      return [];
    }
    return Promise.all(names.map((fileName) => this.describe(directory, fileName)));
  }

  /** Reads the manifest; files that are not Evully backups get `kind: null` and are never pruned. */
  private async describe(directory: string, fileName: string): Promise<StoredBackup> {
    const path = join(directory, fileName);
    try {
      const entry = new AdmZip(path).getEntry(MANIFEST_ENTRY);
      const manifest: unknown = entry ? JSON.parse(entry.getData().toString('utf8')) : null;
      const { kind, createdAt } = (manifest ?? {}) as { kind?: unknown; createdAt?: unknown };
      const parsedKind = backupKindSchema.safeParse(kind);
      if (parsedKind.success && typeof createdAt === 'string') {
        return { fileName, kind: parsedKind.data, createdAt };
      }
    } catch {
      // Unreadable zip: fall through and keep it.
    }
    return { fileName, kind: null, createdAt: (await stat(path)).mtime.toISOString() };
  }

  async remove(directory: string, fileName: string): Promise<void> {
    await rm(join(directory, fileName), { force: true });
  }

  async copy(sourcePath: string, directory: string, fileName: string): Promise<void> {
    await copyFile(sourcePath, join(directory, fileName));
  }

  join(directory: string, fileName: string): string {
    return join(directory, fileName);
  }
}
