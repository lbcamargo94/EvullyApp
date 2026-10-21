import { type Kysely } from 'kysely';

// Household food catalog, shared by all profiles (README §6.1, §9.2).
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('foods')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('brand', 'text')
    .addColumn('reference_amount', 'real', (c) => c.notNull())
    .addColumn('reference_unit', 'text', (c) => c.notNull())
    .addColumn('calories_kcal', 'real', (c) => c.notNull())
    .addColumn('protein_g', 'real', (c) => c.notNull())
    .addColumn('carbohydrate_g', 'real', (c) => c.notNull())
    .addColumn('fat_g', 'real', (c) => c.notNull())
    .addColumn('fiber_g', 'real')
    .addColumn('sodium_mg', 'real')
    .addColumn('source', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema.createIndex('foods_name').on('foods').column('name').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('foods').execute();
}
