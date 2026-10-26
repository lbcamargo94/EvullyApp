import { type Kysely } from 'kysely';

// Workout plans, days and prescribed exercises (README §10.2, §10.3). Every
// table carries profile_id so each query is scoped by profile.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('workout_plans')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('status', 'text', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('workout_plans_profile')
    .on('workout_plans')
    .column('profile_id')
    .execute();

  await db.schema
    .createTable('workout_days')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('plan_id', 'text', (c) =>
      c.notNull().references('workout_plans.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('weekday', 'integer')
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema.createIndex('workout_days_plan').on('workout_days').column('plan_id').execute();

  await db.schema
    .createTable('workout_plan_exercises')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('workout_day_id', 'text', (c) =>
      c.notNull().references('workout_days.id').onDelete('cascade'),
    )
    .addColumn('exercise_id', 'text', (c) => c.notNull().references('exercises.id'))
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('sets', 'integer', (c) => c.notNull())
    .addColumn('target_type', 'text', (c) => c.notNull())
    .addColumn('min_reps', 'integer')
    .addColumn('max_reps', 'integer')
    .addColumn('min_seconds', 'integer')
    .addColumn('max_seconds', 'integer')
    .addColumn('per_side', 'integer', (c) => c.notNull())
    .addColumn('min_rir', 'integer')
    .addColumn('max_rir', 'integer')
    .addColumn('min_rest_seconds', 'integer')
    .addColumn('max_rest_seconds', 'integer')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await db.schema
    .createIndex('workout_plan_exercises_day')
    .on('workout_plan_exercises')
    .column('workout_day_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('workout_plan_exercises').execute();
  await db.schema.dropTable('workout_days').execute();
  await db.schema.dropTable('workout_plans').execute();
}
