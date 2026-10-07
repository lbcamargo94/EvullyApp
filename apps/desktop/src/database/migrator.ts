import type { Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';
import * as m0001 from './migrations/0001_initial';

// Migrations are imported statically so they are bundled into the app.
// Never edit a published migration; add a new one (README §6.4).
const migrations: Record<string, Migration> = {
  '0001_initial': m0001,
};

const provider: MigrationProvider = { getMigrations: async () => migrations };

/** Applies pending migrations; throws if any fails. */
export async function migrateToLatest<DB>(db: Kysely<DB>): Promise<string[]> {
  const { error, results } = await new Migrator({ db, provider }).migrateToLatest();
  if (error) throw error;
  return (results ?? []).filter((r) => r.status === 'Success').map((r) => r.migrationName);
}
