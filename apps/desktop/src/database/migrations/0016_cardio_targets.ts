import { type Kysely } from 'kysely';

// Weekly cardio targets per profile (README §11.1). History only: a change adds a
// row from today on, so past weeks keep the target they had.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('cardio_targets')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('effective_from', 'text', (c) => c.notNull())
    .addColumn('sessions_per_week', 'integer')
    .addColumn('minutes_per_week', 'integer')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('cardio_targets_profile')
    .on('cardio_targets')
    .columns(['profile_id', 'effective_from'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('cardio_targets').execute();
}
