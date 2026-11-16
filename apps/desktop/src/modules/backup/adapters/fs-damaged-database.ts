import { copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { DamagedDatabase } from '../ports/backup-ports';

/** Keeps a copy of the damaged `evully.db` in the data folder; the original is untouched. */
export class FsDamagedDatabase implements DamagedDatabase {
  constructor(private readonly databaseFile: string) {}

  async existingNames(): Promise<Set<string>> {
    return new Set(await readdir(dirname(this.databaseFile)));
  }

  async keepCopy(fileName: string): Promise<void> {
    const target = join(dirname(this.databaseFile), fileName);
    await copyFile(this.databaseFile, target);
    const wal = `${this.databaseFile}-wal`;
    if (existsSync(wal)) await copyFile(wal, `${target}-wal`);
  }
}
