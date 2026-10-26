import { type Kysely } from 'kysely';

// Cardio sessions per profile (README §11.1). The session's steps are only its
// own data; the day's steps are the "Passos" habit (§11.2).
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('cardio_sessions')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('session_date', 'text', (c) => c.notNull())
    .addColumn('started_at', 'text', (c) => c.notNull())
    .addColumn('activity_type', 'text', (c) => c.notNull())
    .addColumn('activity_name', 'text')
    .addColumn('duration_minutes', 'integer', (c) => c.notNull())
    .addColumn('distance_km', 'real')
    .addColumn('steps', 'integer')
    .addColumn('intensity', 'text')
    .addColumn('heart_rate_average', 'integer')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('cardio_sessions_profile_date')
    .on('cardio_sessions')
    .columns(['profile_id', 'session_date'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('cardio_sessions').execute();
}
