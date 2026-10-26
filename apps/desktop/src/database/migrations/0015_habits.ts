import { type Kysely } from 'kysely';

// Generic habits per profile (README §11.2): definitions and one log per habit
// per day. Values are numbers (see the domain for each type).
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('habit_definitions')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('type', 'text', (c) => c.notNull())
    .addColumn('unit', 'text')
    .addColumn('target_value', 'real')
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('is_active', 'integer', (c) => c.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('habit_definitions_profile')
    .on('habit_definitions')
    .column('profile_id')
    .execute();

  await db.schema
    .createTable('habit_logs')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('habit_definition_id', 'text', (c) =>
      c.notNull().references('habit_definitions.id').onDelete('cascade'),
    )
    .addColumn('log_date', 'text', (c) => c.notNull())
    .addColumn('value', 'real', (c) => c.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('habit_logs_profile_date')
    .on('habit_logs')
    .columns(['profile_id', 'log_date'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('habit_logs').execute();
  await db.schema.dropTable('habit_definitions').execute();
}
