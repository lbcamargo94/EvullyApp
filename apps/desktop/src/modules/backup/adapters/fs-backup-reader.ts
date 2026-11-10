import { backupKindSchema } from '@evully/contracts';
import { ValidationError } from '@evully/domain';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, renameSync, rmSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { BackupReader, OpenedBackup } from '../ports/backup-ports';

const DB_ENTRY = 'evully.db';
const MANIFEST_ENTRY = 'manifest.json';

const manifestSchema = z.object({
  appVersion: z.string(),
  schemaVersion: z.string(),
  createdAt: z.string(),
  kind: backupKindSchema,
  sha256: z.string(),
});

const invalid = () => new ValidationError('backup.restore_invalid', 'Not an Evully backup');

/** Entries of a backup zip, refusing anything but the two expected files (zip slip). */
function entriesOf(path: string) {
  let zip: AdmZip;
  try {
    zip = new AdmZip(path);
  } catch {
    throw invalid();
  }
  const entries = zip.getEntries();
  const names = entries.map((e) => e.entryName).sort();
  if (names.join('|') !== `${DB_ENTRY}|${MANIFEST_ENTRY}`) throw invalid();
  const data = (name: string) => {
    const entry = entries.find((e) => e.entryName === name);
    if (!entry) throw invalid();
    return entry.getData();
  };
  return { database: data(DB_ENTRY), manifest: data(MANIFEST_ENTRY) };
}

function parseManifest(bytes: Buffer) {
  try {
    return manifestSchema.parse(JSON.parse(bytes.toString('utf8')));
  } catch {
    throw invalid();
  }
}

/** Integrity, schema version and profile names of an extracted database, opened read-only. */
function inspect(file: string): Pick<OpenedBackup, 'integrityOk' | 'schemaVersion' | 'profiles'> {
  let sqlite: Database.Database;
  try {
    sqlite = new Database(file, { readonly: true, fileMustExist: true });
  } catch {
    throw invalid();
  }
  try {
    const integrity = sqlite.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') return { integrityOk: false, schemaVersion: '', profiles: [] };
    const migration = sqlite
      .prepare('SELECT name FROM kysely_migration ORDER BY name DESC LIMIT 1')
      .get() as { name: string } | undefined;
    const profiles = sqlite
      .prepare('SELECT name FROM profiles WHERE deleted_at IS NULL ORDER BY name')
      .all() as { name: string }[];
    return {
      integrityOk: true,
      schemaVersion: migration?.name ?? '',
      profiles: profiles.map((p) => p.name),
    };
  } catch {
    // Not a database, or not an Evully one.
    return { integrityOk: false, schemaVersion: '', profiles: [] };
  } finally {
    sqlite.close();
  }
}

export class FsBackupReader implements BackupReader {
  constructor(
    /** Private scratch folder inside the app data directory. */
    private readonly tempDirectory: string,
    /** Where the next start looks for a database to swap in. */
    private readonly pendingFile: string,
  ) {}

  async open(path: string): Promise<OpenedBackup> {
    const { database, manifest } = entriesOf(path);
    const parsed = parseManifest(manifest);
    await mkdir(this.tempDirectory, { recursive: true });
    const databaseFile = join(this.tempDirectory, `${randomUUID()}.db`);
    await writeFile(databaseFile, database);
    try {
      return {
        manifest: parsed,
        databaseFile,
        sha256: createHash('sha256').update(database).digest('hex'),
        ...inspect(databaseFile),
      };
    } catch (error) {
      await this.discard(databaseFile);
      throw error;
    }
  }

  async discard(databaseFile: string): Promise<void> {
    await rm(databaseFile, { force: true });
  }

  async stage(databaseFile: string): Promise<void> {
    rmSync(this.pendingFile, { force: true });
    renameSync(databaseFile, this.pendingFile);
  }
}

/**
 * Swaps a staged restore in before the database opens (README §14.2). The
 * current database was already backed up (`pre-restore`); its WAL files are
 * removed so they are not replayed over the restored one.
 */
export function applyPendingRestore(databaseFile: string, pendingFile: string): boolean {
  if (!existsSync(pendingFile)) return false;
  for (const suffix of ['-wal', '-shm']) rmSync(`${databaseFile}${suffix}`, { force: true });
  renameSync(pendingFile, databaseFile);
  return true;
}
