import { type Kysely } from 'kysely';

// Workout sessions, the exercises done in them and their sets (README §10.4).
// A performance links a session to an exercise, so exercises can be swapped
// or added during the session. Every table carries profile_id.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('workout_sessions')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('workout_day_id', 'text', (c) => c.references('workout_days.id'))
    .addColumn('started_at', 'text', (c) => c.notNull())
    .addColumn('finished_at', 'text')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('workout_sessions_profile')
    .on('workout_sessions')
    .columns(['profile_id', 'started_at'])
    .execute();

  await db.schema
    .createTable('exercise_performances')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('session_id', 'text', (c) =>
      c.notNull().references('workout_sessions.id').onDelete('cascade'),
    )
    .addColumn('exercise_id', 'text', (c) => c.notNull().references('exercises.id'))
    .addColumn('plan_exercise_id', 'text', (c) => c.references('workout_plan_exercises.id'))
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('exercise_performances_session')
    .on('exercise_performances')
    .column('session_id')
    .execute();
  await db.schema
    .createIndex('exercise_performances_exercise')
    .on('exercise_performances')
    .columns(['profile_id', 'exercise_id'])
    .execute();

  await db.schema
    .createTable('exercise_sets')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('performance_id', 'text', (c) =>
      c.notNull().references('exercise_performances.id').onDelete('cascade'),
    )
    .addColumn('set_number', 'integer', (c) => c.notNull())
    .addColumn('weight_kg', 'real')
    .addColumn('repetitions', 'integer')
    .addColumn('duration_seconds', 'integer')
    .addColumn('rir', 'integer')
    .addColumn('completed', 'integer', (c) => c.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('exercise_sets_performance')
    .on('exercise_sets')
    .column('performance_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('exercise_sets').execute();
  await db.schema.dropTable('exercise_performances').execute();
  await db.schema.dropTable('workout_sessions').execute();
}
