import { type Kysely } from 'kysely';

// Nightly sleep targets per profile (README §13.1). History only: a change adds a
// row from today on, so past nights keep the target they had.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('sleep_targets')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('effective_from', 'text', (c) => c.notNull())
    .addColumn('minutes_per_night', 'integer')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('sleep_targets_profile')
    .on('sleep_targets')
    .columns(['profile_id', 'effective_from'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('sleep_targets').execute();
}
