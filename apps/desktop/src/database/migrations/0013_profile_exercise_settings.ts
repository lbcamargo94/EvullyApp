import { type Kysely } from 'kysely';

// Per-profile settings of an exercise (README §10.6): the load increment used
// in progression suggestions, also for shared system exercises.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('profile_exercise_settings')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('exercise_id', 'text', (c) => c.notNull().references('exercises.id'))
    .addColumn('load_increment_kg', 'real')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addUniqueConstraint('profile_exercise_settings_unique', ['profile_id', 'exercise_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('profile_exercise_settings').execute();
}
