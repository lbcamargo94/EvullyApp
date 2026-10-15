import { type Kysely } from 'kysely';

// Weighings and their tags (README §8.3).
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('body_weights')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('measured_on', 'text', (c) => c.notNull())
    .addColumn('measured_at', 'text', (c) => c.notNull())
    .addColumn('weight_kg', 'real', (c) => c.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('body_weights_profile_date')
    .on('body_weights')
    .columns(['profile_id', 'measured_on'])
    .execute();

  // Link table: no updated_at or deleted_at; links are created or removed (README §6.1).
  await db.schema
    .createTable('body_weight_tags')
    .addColumn('body_weight_id', 'text', (c) =>
      c.notNull().references('body_weights.id').onDelete('cascade'),
    )
    .addColumn('tag_id', 'text', (c) => c.notNull().references('tags.id').onDelete('cascade'))
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addPrimaryKeyConstraint('body_weight_tags_pk', ['body_weight_id', 'tag_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('body_weight_tags').execute();
  await db.schema.dropTable('body_weights').execute();
}
