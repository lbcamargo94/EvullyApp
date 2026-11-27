import { type Kysely } from 'kysely';

// Evully Health (README §24.2): the laboratory PDF attached to an exam, kept
// inside the database (decided on 2026-11-26) so the backup carries it without
// changing its zip format. Zero or one active document per exam; soft delete.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('health_documents')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('exam_id', 'text', (c) =>
      c.notNull().references('health_exams.id').onDelete('cascade'),
    )
    .addColumn('file_name', 'text', (c) => c.notNull())
    .addColumn('size_bytes', 'integer', (c) => c.notNull())
    .addColumn('sha256', 'text', (c) => c.notNull())
    .addColumn('content', 'blob', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('health_documents_exam')
    .on('health_documents')
    .columns(['profile_id', 'exam_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('health_documents').execute();
}
