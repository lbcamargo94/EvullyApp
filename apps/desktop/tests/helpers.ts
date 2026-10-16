import { parseLocalDate } from '@evully/domain';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../src/database/connection';
import { migrateToLatest } from '../src/database/migrator';
import { buildApp } from '../src/main/composition-root';
import type { BackupDialogs } from '../src/modules/backup/ports/backup-ports';
import type { ImportFiles } from '../src/modules/imports/ports/import-ports';
import type { Clock, IdGenerator } from '../src/modules/shared/ports';

export const fixedClock = (
  iso = '2026-10-07T10:00:00.000Z',
  today = '2026-10-07',
  time = '07:00',
): Clock => ({
  nowIso: () => iso,
  today: () => parseLocalDate(today),
  localTime: () => time,
  // Tests run as if the user were in UTC.
  localToIso: (date, t) => `${date}T${t}:00.000Z`,
});

/** Deterministic UUID v7-shaped ids: …-7000-8000-000000000001, …0002, … */
export const sequentialIds = (): IdGenerator => {
  let n = 0;
  return {
    next: () => `01900000-0000-7000-8000-${String(++n).padStart(12, '0')}`,
  };
};

/** Dialogs that are always cancelled. */
export const noDialogs: BackupDialogs = {
  chooseSavePath: async () => null,
  chooseDirectory: async () => null,
};

/** Import dialogs that are always cancelled. */
export const noImportFiles: ImportFiles = {
  chooseCsv: async () => null,
  saveText: async () => false,
};

/** Migrated database in a temp folder plus the app's handlers wired to it. */
export async function createTestApp(
  clock: Clock = fixedClock(),
  dialogs: BackupDialogs = noDialogs,
  importFiles: ImportFiles = noImportFiles,
) {
  const dir = mkdtempSync(join(tmpdir(), 'evully-test-'));
  const db = openDatabase(join(dir, 'evully.db'));
  await migrateToLatest(db);
  const ids = sequentialIds();
  const { handlers, lifecycle } = buildApp({
    db,
    clock,
    ids,
    appInfo: () => ({ version: '0.0.0-test', environment: 'development' }),
    backup: {
      defaultDirectory: join(dir, 'backups'),
      tempDirectory: join(dir, 'tmp'),
      dialogs,
    },
    importFiles,
  });
  const dispose = async () => {
    await db.destroy();
    rmSync(dir, { recursive: true, force: true });
  };
  return { db, dir, handlers, lifecycle, ids, dispose };
}

/** Narrows an optional test value, failing the test with a clear message when it is missing. */
export function must<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what} to exist`);
  return value;
}
