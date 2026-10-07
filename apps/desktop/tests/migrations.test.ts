import { sql } from 'kysely';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../src/database/connection';
import { migrateToLatest } from '../src/database/migrator';

describe('database', () => {
  const dirs: string[] = [];
  const tempDb = () => {
    const dir = mkdtempSync(join(tmpdir(), 'evully-test-'));
    dirs.push(dir);
    return openDatabase(join(dir, 'evully.db'));
  };

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('applies all migrations on a new database, then nothing on the second run', async () => {
    const db = tempDb();
    expect(await migrateToLatest(db)).toEqual(['0001_initial', '0002_profiles_settings']);
    expect(await migrateToLatest(db)).toEqual([]);
    await db.destroy();
  });

  it('enables foreign keys and WAL', async () => {
    const db = tempDb();
    const fk = await sql<{ foreign_keys: number }>`PRAGMA foreign_keys`.execute(db);
    const wal = await sql<{ journal_mode: string }>`PRAGMA journal_mode`.execute(db);
    expect(fk.rows[0]?.foreign_keys).toBe(1);
    expect(wal.rows[0]?.journal_mode).toBe('wal');
    await db.destroy();
  });
});
