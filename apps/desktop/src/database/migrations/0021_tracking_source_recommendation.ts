import { sql, type Kysely } from 'kysely';

// Tracking configs gain `source = 'recommendation'`: the record an accepted
// tracking suggestion creates (README §8.3, §20.2). SQLite cannot change a
// CHECK constraint, so the table is rebuilt with every row kept. No table
// references tracking_configs.
const SOURCES = {
  up: sql`source in ('questionnaire', 'manual', 'template', 'professional', 'recommendation')`,
  down: sql`source in ('questionnaire', 'manual', 'template', 'professional')`,
};

async function rebuild(db: Kysely<unknown>, check: typeof SOURCES.up): Promise<void> {
  await db.schema
    .createTable('tracking_configs_next')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('effective_from', 'text', (c) => c.notNull())
    .addColumn('weight_display', 'text', (c) =>
      c.notNull().check(sql`weight_display in ('trend', 'daily', 'hidden')`),
    )
    .addColumn('focus_areas', 'text', (c) => c.notNull())
    .addColumn('enabled_modules', 'text', (c) => c.notNull().defaultTo('[]'))
    .addColumn('source', 'text', (c) => c.notNull().check(check))
    .addColumn('rule_version', 'text')
    .addColumn('questionnaire_id', 'text', (c) => c.references('profile_questionnaires.id'))
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .execute();
  await sql`INSERT INTO tracking_configs_next
    (id, profile_id, effective_from, weight_display, focus_areas, enabled_modules, source,
     rule_version, questionnaire_id, created_at, updated_at)
    SELECT id, profile_id, effective_from, weight_display, focus_areas, enabled_modules, source,
     rule_version, questionnaire_id, created_at, updated_at
    FROM tracking_configs`.execute(db);
  await db.schema.dropTable('tracking_configs').execute();
  await db.schema.alterTable('tracking_configs_next').renameTo('tracking_configs').execute();
  await db.schema
    .createIndex('tracking_configs_profile_date')
    .on('tracking_configs')
    .columns(['profile_id', 'effective_from'])
    .execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
  await rebuild(db, SOURCES.up);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Configs from suggestions become manual ones, which the old check allows.
  await sql`UPDATE tracking_configs SET source = 'manual' WHERE source = 'recommendation'`.execute(
    db,
  );
  await rebuild(db, SOURCES.down);
}
