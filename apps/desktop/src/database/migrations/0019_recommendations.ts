import { sql, type Kysely } from 'kysely';

// Recommendation signals and the user's decisions (README §20.2). A signal keeps
// the numbers that raised it as validated JSON (`evidence`), with its rule and
// version (ARCHITECTURE §9). Decisions are history only.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('recommendation_events')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('rule_id', 'text', (c) => c.notNull())
    .addColumn('rule_version', 'integer', (c) => c.notNull())
    .addColumn('subject_key', 'text', (c) => c.notNull())
    .addColumn('level', 'text', (c) => c.notNull().check(sql`level in ('info', 'attention')`))
    .addColumn('evidence', 'text', (c) => c.notNull())
    .addColumn('detected_on', 'text', (c) => c.notNull())
    .addColumn('status', 'text', (c) =>
      c.notNull().check(sql`status in ('open', 'snoozed', 'dismissed', 'accepted', 'resolved')`),
    )
    .addColumn('status_on', 'text', (c) => c.notNull())
    .addColumn('snoozed_until', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('recommendation_events_profile')
    .on('recommendation_events')
    .columns(['profile_id', 'rule_id', 'subject_key'])
    .execute();

  await db.schema
    .createTable('recommendation_decisions')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('event_id', 'text', (c) =>
      c.notNull().references('recommendation_events.id').onDelete('cascade'),
    )
    .addColumn('decision', 'text', (c) =>
      c.notNull().check(sql`decision in ('dismissed', 'snoozed', 'accepted')`),
    )
    .addColumn('decided_at', 'text', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('recommendation_decisions_event')
    .on('recommendation_decisions')
    .columns(['profile_id', 'event_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('recommendation_decisions').execute();
  await db.schema.dropTable('recommendation_events').execute();
}
