import { type Kysely } from 'kysely';

// Optional weekly pace band of a project, in kg/week (README §7.1, §20.2), for
// the "pace outside the band" signal. Null for every existing project.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('projects').addColumn('weekly_rate_min_kg', 'real').execute();
  await db.schema.alterTable('projects').addColumn('weekly_rate_max_kg', 'real').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('projects').dropColumn('weekly_rate_max_kg').execute();
  await db.schema.alterTable('projects').dropColumn('weekly_rate_min_kg').execute();
}
