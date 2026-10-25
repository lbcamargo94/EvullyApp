import { type Kysely } from 'kysely';

// Foods logged on a day, per profile (README §9.4). Each row keeps a copy of
// the food (food_snapshot) and the nutrients for its quantity, so editing a
// food never changes past days.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('food_logs')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('log_date', 'text', (c) => c.notNull())
    .addColumn('meal_type', 'text', (c) => c.notNull())
    .addColumn('meal_name', 'text')
    .addColumn('food_id', 'text', (c) => c.notNull().references('foods.id'))
    .addColumn('food_snapshot', 'text', (c) => c.notNull())
    .addColumn('quantity', 'real', (c) => c.notNull())
    .addColumn('calories_kcal', 'real', (c) => c.notNull())
    .addColumn('protein_g', 'real', (c) => c.notNull())
    .addColumn('carbohydrate_g', 'real', (c) => c.notNull())
    .addColumn('fat_g', 'real', (c) => c.notNull())
    .addColumn('fiber_g', 'real')
    .addColumn('sodium_mg', 'real')
    .addColumn('consumed_at', 'text')
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('food_logs_profile_date')
    .on('food_logs')
    .columns(['profile_id', 'log_date'])
    .execute();
  await db.schema.createIndex('food_logs_food').on('food_logs').column('food_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('food_logs').execute();
}
