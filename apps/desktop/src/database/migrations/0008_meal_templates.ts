import { type Kysely } from 'kysely';

// Favorite meals per profile (README §9.5): foods and quantities only; values
// are taken from the current foods when a favorite is applied.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('meal_templates')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('meal_templates_profile')
    .on('meal_templates')
    .column('profile_id')
    .execute();

  // Items belong to their template: no updated_at or deleted_at (README §6.1).
  await db.schema
    .createTable('meal_template_items')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('meal_template_id', 'text', (c) =>
      c.notNull().references('meal_templates.id').onDelete('cascade'),
    )
    .addColumn('food_id', 'text', (c) => c.notNull().references('foods.id'))
    .addColumn('quantity', 'real', (c) => c.notNull())
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('meal_template_items_template')
    .on('meal_template_items')
    .column('meal_template_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('meal_template_items').execute();
  await db.schema.dropTable('meal_templates').execute();
}
