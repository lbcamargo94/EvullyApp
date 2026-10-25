import { type Kysely } from 'kysely';

// Nutrition targets (history only, README §6.1, §9.6) and water logs (§9.4.1).
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('nutrition_targets')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('effective_from', 'text', (c) => c.notNull())
    .addColumn('calories_kcal', 'real', (c) => c.notNull())
    .addColumn('protein_g', 'real', (c) => c.notNull())
    .addColumn('carbohydrate_g', 'real')
    .addColumn('fat_g', 'real')
    .addColumn('water_ml', 'real')
    .addColumn('reason', 'text')
    .addColumn('source', 'text', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('nutrition_targets_profile')
    .on('nutrition_targets')
    .columns(['profile_id', 'effective_from'])
    .execute();

  await db.schema
    .createTable('water_logs')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('log_date', 'text', (c) => c.notNull())
    .addColumn('amount_ml', 'real', (c) => c.notNull())
    .addColumn('logged_at', 'text', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('water_logs_profile_date')
    .on('water_logs')
    .columns(['profile_id', 'log_date'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('water_logs').execute();
  await db.schema.dropTable('nutrition_targets').execute();
}
