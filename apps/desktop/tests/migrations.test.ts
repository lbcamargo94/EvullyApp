import { sql } from 'kysely';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../src/database/connection';
import { hasPendingMigrations, migrateToLatest } from '../src/database/migrator';

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
    expect(await migrateToLatest(db)).toEqual([
      '0001_initial',
      '0002_profiles_settings',
      '0003_tracking',
      '0004_body_weights',
      '0005_body_measurements',
      '0006_foods',
      '0007_food_logs',
      '0008_meal_templates',
      '0009_nutrition_targets_water',
      '0010_exercises',
      '0011_workout_plans',
      '0012_workout_sessions',
      '0013_profile_exercise_settings',
      '0014_cardio_sessions',
      '0015_habits',
      '0016_cardio_targets',
      '0017_sleep_logs',
      '0018_sleep_targets',
    ]);
    expect(await migrateToLatest(db)).toEqual([]);
    await db.destroy();
  });

  it('detects pending migrations, which trigger the pre-migration backup', async () => {
    const db = tempDb();
    expect(await hasPendingMigrations(db)).toBe(true);
    await migrateToLatest(db);
    expect(await hasPendingMigrations(db)).toBe(false);
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
