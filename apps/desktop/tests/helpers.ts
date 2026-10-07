import { parseLocalDate } from '@evully/domain';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../src/database/connection';
import { migrateToLatest } from '../src/database/migrator';
import { buildIpcHandlers } from '../src/main/composition-root';
import type { Clock, IdGenerator } from '../src/modules/shared/ports';

export const fixedClock = (iso = '2026-10-07T10:00:00.000Z', today = '2026-10-07'): Clock => ({
  nowIso: () => iso,
  today: () => parseLocalDate(today),
});

/** Deterministic UUID v7-shaped ids: …-7000-8000-000000000001, …0002, … */
export const sequentialIds = (): IdGenerator => {
  let n = 0;
  return {
    next: () => `01900000-0000-7000-8000-${String(++n).padStart(12, '0')}`,
  };
};

/** Migrated database in a temp folder plus the app's handlers wired to it. */
export async function createTestApp(clock: Clock = fixedClock()) {
  const dir = mkdtempSync(join(tmpdir(), 'evully-test-'));
  const db = openDatabase(join(dir, 'evully.db'));
  await migrateToLatest(db);
  const ids = sequentialIds();
  const handlers = buildIpcHandlers({
    db,
    clock,
    ids,
    appInfo: () => ({ version: '0.0.0-test', environment: 'development' }),
  });
  const dispose = async () => {
    await db.destroy();
    rmSync(dir, { recursive: true, force: true });
  };
  return { db, handlers, ids, dispose };
}
