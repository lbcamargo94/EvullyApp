import { type Kysely } from 'kysely';

// Local reminders (README §25). Preferences keep history (§28): a change adds a
// row per type, the latest row of each type is the current one. Events record
// each reminder shown, at most one per type and local day. `event_type` and
// `channel` have no CHECK: later versions add values, validated by zod
// (ARCHITECTURE §9).
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('notification_preferences')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('channel', 'text', (c) => c.notNull())
    .addColumn('event_type', 'text', (c) => c.notNull())
    .addColumn('enabled', 'integer', (c) => c.notNull())
    .addColumn('preferred_time', 'text', (c) => c.notNull())
    .addColumn('weekday', 'integer')
    .addColumn('quiet_hours_start', 'text')
    .addColumn('quiet_hours_end', 'text')
    // Null on the desktop: it follows the computer's time zone.
    .addColumn('timezone', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('notification_preferences_profile')
    .on('notification_preferences')
    .columns(['profile_id', 'event_type', 'created_at'])
    .execute();

  await db.schema
    .createTable('notification_events')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('channel', 'text', (c) => c.notNull())
    .addColumn('event_type', 'text', (c) => c.notNull())
    .addColumn('local_date', 'text', (c) => c.notNull())
    .addColumn('shown_at', 'text', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addUniqueConstraint('notification_events_once', [
      'profile_id',
      'channel',
      'event_type',
      'local_date',
    ])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('notification_events').execute();
  await db.schema.dropTable('notification_preferences').execute();
}
