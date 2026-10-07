import { sql, type Kysely } from 'kysely';

// Profiles and settings (README §8.3). Columns follow the conventions of README §6.1.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('profiles')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('birth_date', 'text')
    .addColumn('sex', 'text', (c) => c.check(sql`sex in ('male', 'female')`))
    .addColumn('height_cm', 'real')
    .addColumn('avatar_path', 'text')
    .addColumn('unit_system', 'text', (c) => c.notNull().defaultTo('metric'))
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();

  await db.schema
    .createTable('settings')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) => c.references('profiles.id').onDelete('cascade'))
    .addColumn('key', 'text', (c) => c.notNull())
    .addColumn('value', 'text', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .execute();

  // NULL never collides in a SQLite UNIQUE index, so global and per-profile keys
  // each get their own partial index (README §6.1).
  await sql`CREATE UNIQUE INDEX settings_global_key ON settings (key) WHERE profile_id IS NULL`.execute(
    db,
  );
  await sql`CREATE UNIQUE INDEX settings_profile_key ON settings (profile_id, key) WHERE profile_id IS NOT NULL`.execute(
    db,
  );
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('settings').execute();
  await db.schema.dropTable('profiles').execute();
}
