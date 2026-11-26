import { type Kysely } from 'kysely';

// Evully Health (README §24): laboratory exams typed by hand. Results keep the
// laboratory's own reference range (§24.2); the flag against it is derived on
// read, never stored. Results carry `profile_id` too, so every query filters by
// profile (§6.1). Soft delete on both tables.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('health_exams')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('collected_on', 'text', (c) => c.notNull())
    .addColumn('laboratory', 'text')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('health_exams_profile')
    .on('health_exams')
    .columns(['profile_id', 'collected_on'])
    .execute();

  await db.schema
    .createTable('health_exam_results')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('exam_id', 'text', (c) =>
      c.notNull().references('health_exams.id').onDelete('cascade'),
    )
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('analyte_code', 'text')
    .addColumn('analyte_name', 'text', (c) => c.notNull())
    .addColumn('value', 'real', (c) => c.notNull())
    .addColumn('unit', 'text', (c) => c.notNull())
    .addColumn('reference_min', 'real')
    .addColumn('reference_max', 'real')
    .addColumn('reference_text', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('health_exam_results_exam')
    .on('health_exam_results')
    .columns(['profile_id', 'exam_id', 'sort_order'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('health_exam_results').execute();
  await db.schema.dropTable('health_exams').execute();
}
