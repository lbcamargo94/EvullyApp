import { sql, type Kysely } from 'kysely';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../src/database/connection';
import * as m0021 from '../src/database/migrations/0021_tracking_source_recommendation';
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
      '0019_recommendations',
      '0020_project_rate_band',
      '0021_tracking_source_recommendation',
      '0022_reminders',
      '0023_health',
      '0024_health_documents',
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

  it('0021 rebuilds tracking_configs keeping every row and allows source = recommendation', async () => {
    const db = tempDb();
    await migrateToLatest(db);
    const at = '2026-11-24T12:00:00.000Z';
    const profile = '01930000-0000-7000-8000-000000000001';
    await sql`INSERT INTO profiles (id, name, created_at, updated_at) VALUES (${profile}, 'Ana', ${at}, ${at})`.execute(
      db,
    );
    const config = (id: string, source: string) =>
      sql`INSERT INTO tracking_configs (id, profile_id, effective_from, weight_display, focus_areas, source, created_at, updated_at)
        VALUES (${id}, ${profile}, '2026-11-24', 'trend', '["waist"]', ${source}, ${at}, ${at})`.execute(
        db,
      );
    const raw = db as unknown as Kysely<unknown>;
    await m0021.down(raw);
    await config('01930000-0000-7000-8000-000000000002', 'manual');
    await expect(
      config('01930000-0000-7000-8000-000000000003', 'recommendation'),
    ).rejects.toThrow();
    await m0021.up(raw);
    await config('01930000-0000-7000-8000-000000000003', 'recommendation');
    const rows = await sql<{
      source: string;
    }>`SELECT source FROM tracking_configs ORDER BY id`.execute(db);
    expect(rows.rows.map((r) => r.source)).toEqual(['manual', 'recommendation']);
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
