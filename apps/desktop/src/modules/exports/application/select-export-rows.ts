import type { ProfileTables, SharedIds } from '../ports/export-ports';

const live = <T extends { deleted_at: string | null }>(rows: T[]) =>
  rows.filter((r) => r.deleted_at === null);

const idsOf = (rows: readonly { id: string }[]) => new Set(rows.map((r) => r.id));

const refs = <T>(rows: readonly T[], key: (row: T) => string | null) =>
  new Set(rows.flatMap((r) => (key(r) === null ? [] : [key(r) as string])));

const withParent = <T>(rows: T[], key: (row: T) => string, parents: Set<string>) =>
  rows.filter((r) => parents.has(key(r)));

/** `kept` plus the rows of `all` (even soft-deleted) whose id is in `needed`. */
const including = <T extends { id: string }>(kept: T[], all: readonly T[], needed: Set<string>) => {
  const have = idsOf(kept);
  return [...kept, ...all.filter((r) => needed.has(r.id) && !have.has(r.id))];
};

/**
 * What the JSON export holds (README §14.3): soft-deleted rows and the
 * children of deleted rows stay out; a deleted row that a kept row still
 * points to (a removed plan day of an old workout, a removed tag of a
 * weighing) is kept so the file stays consistent for a profile transfer (§14.4).
 */
export function selectExportRows(all: ProfileTables): ProfileTables {
  const sessions = live(all.workout_sessions);
  const performances = withParent(
    live(all.exercise_performances),
    (p) => p.session_id,
    idsOf(sessions),
  );
  const sets = withParent(live(all.exercise_sets), (s) => s.performance_id, idsOf(performances));

  const livePlans = live(all.workout_plans);
  const liveDays = withParent(live(all.workout_days), (d) => d.plan_id, idsOf(livePlans));
  const planExercises = including(
    withParent(live(all.workout_plan_exercises), (e) => e.workout_day_id, idsOf(liveDays)),
    all.workout_plan_exercises,
    refs(performances, (p) => p.plan_exercise_id),
  );
  const days = including(
    liveDays,
    all.workout_days,
    new Set([
      ...refs(sessions, (s) => s.workout_day_id),
      ...refs(planExercises, (e) => e.workout_day_id),
    ]),
  );

  const weights = live(all.body_weights);
  const weightTags = withParent(all.body_weight_tags, (t) => t.body_weight_id, idsOf(weights));
  const measurements = live(all.body_measurements);
  const templates = live(all.meal_templates);

  return {
    ...all,
    projects: live(all.projects),
    tags: including(
      live(all.tags),
      all.tags,
      refs(weightTags, (t) => t.tag_id),
    ),
    body_weights: weights,
    body_weight_tags: weightTags,
    body_measurements: measurements,
    body_measurement_values: withParent(
      all.body_measurement_values,
      (v) => v.measurement_id,
      idsOf(measurements),
    ),
    food_logs: live(all.food_logs),
    meal_templates: templates,
    meal_template_items: withParent(
      all.meal_template_items,
      (i) => i.meal_template_id,
      idsOf(templates),
    ),
    water_logs: live(all.water_logs),
    workout_plans: including(
      livePlans,
      all.workout_plans,
      refs(days, (d) => d.plan_id),
    ),
    workout_days: days,
    workout_plan_exercises: planExercises,
    workout_sessions: sessions,
    exercise_performances: performances,
    exercise_sets: sets,
    cardio_sessions: live(all.cardio_sessions),
    sleep_logs: live(all.sleep_logs),
    habit_logs: live(all.habit_logs),
  };
}

/** Rows of shared catalogs the selected rows point to. */
export function sharedIdsOf(rows: ProfileTables): SharedIds {
  return {
    foodIds: [
      ...new Set([
        ...rows.food_logs.map((l) => l.food_id),
        ...rows.meal_template_items.map((i) => i.food_id),
      ]),
    ],
    measurementTypeIds: [
      ...new Set([
        ...rows.profile_measurement_types.map((t) => t.measurement_type_id),
        ...rows.body_measurement_values.map((v) => v.measurement_type_id),
      ]),
    ],
    exerciseIds: [
      ...new Set([
        ...rows.workout_plan_exercises.map((e) => e.exercise_id),
        ...rows.exercise_performances.map((p) => p.exercise_id),
        ...rows.profile_exercise_settings.map((s) => s.exercise_id),
      ]),
    ],
  };
}
