import { sql, type Kysely } from 'kysely';

// Nights of sleep per profile (README §7.7, §12.1). One active night per day:
// the day the person wakes up on.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('sleep_logs')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('sleep_date', 'text', (c) => c.notNull())
    .addColumn('bed_time', 'text', (c) => c.notNull())
    .addColumn('sleep_time', 'text')
    .addColumn('wake_time', 'text', (c) => c.notNull())
    .addColumn('duration_minutes', 'integer', (c) => c.notNull())
    .addColumn('quality', 'integer')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('sleep_logs_profile_date_active')
    .on('sleep_logs')
    .columns(['profile_id', 'sleep_date'])
    .unique()
    .where(sql.ref('deleted_at'), 'is', null)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('sleep_logs').execute();
}
