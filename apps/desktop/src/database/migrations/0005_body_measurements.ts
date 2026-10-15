import type { Kysely } from 'kysely';

// Measuring sessions and their values (README §8.3).
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('body_measurements')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('measured_on', 'text', (c) => c.notNull())
    .addColumn('measured_at', 'text', (c) => c.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('body_measurements_profile_date')
    .on('body_measurements')
    .columns(['profile_id', 'measured_on'])
    .execute();

  await db.schema
    .createTable('body_measurement_values')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('measurement_id', 'text', (c) =>
      c.notNull().references('body_measurements.id').onDelete('cascade'),
    )
    .addColumn('measurement_type_id', 'text', (c) => c.notNull().references('measurement_types.id'))
    .addColumn('value_cm', 'real', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addUniqueConstraint('body_measurement_values_unique', [
      'measurement_id',
      'measurement_type_id',
    ])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('body_measurement_values').execute();
  await db.schema.dropTable('body_measurements').execute();
}
