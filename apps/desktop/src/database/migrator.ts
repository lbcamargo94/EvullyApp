import type { Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';
import * as m0001 from './migrations/0001_initial';
import * as m0002 from './migrations/0002_profiles_settings';
import * as m0003 from './migrations/0003_tracking';
import * as m0004 from './migrations/0004_body_weights';
import * as m0005 from './migrations/0005_body_measurements';
import * as m0006 from './migrations/0006_foods';
import * as m0007 from './migrations/0007_food_logs';
import * as m0008 from './migrations/0008_meal_templates';
import * as m0009 from './migrations/0009_nutrition_targets_water';

// Migrations are imported statically so they are bundled into the app.
// Never edit a published migration; add a new one (README §6.4).
const migrations: Record<string, Migration> = {
  '0001_initial': m0001,
  '0002_profiles_settings': m0002,
  '0003_tracking': m0003,
  '0004_body_weights': m0004,
  '0005_body_measurements': m0005,
  '0006_foods': m0006,
  '0007_food_logs': m0007,
  '0008_meal_templates': m0008,
  '0009_nutrition_targets_water': m0009,
};

const provider: MigrationProvider = { getMigrations: async () => migrations };

/** Applies pending migrations; throws if any fails. */
export async function migrateToLatest<DB>(db: Kysely<DB>): Promise<string[]> {
  const { error, results } = await new Migrator({ db, provider }).migrateToLatest();
  if (error) throw error;
  return (results ?? []).filter((r) => r.status === 'Success').map((r) => r.migrationName);
}

/** True when the database has migrations that were not applied yet. */
export async function hasPendingMigrations<DB>(db: Kysely<DB>): Promise<boolean> {
  const all = await new Migrator({ db, provider }).getMigrations();
  return all.some((m) => m.executedAt === undefined);
}
