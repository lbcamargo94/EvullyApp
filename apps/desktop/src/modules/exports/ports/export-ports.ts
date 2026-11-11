import type { DatabaseSchema, ProfilesTable } from '../../../database/schema';

/** Tables with a `profile_id` column, exported as rows of the profile (README §14.3). */
export const PROFILE_EXPORT_TABLES = [
  'settings',
  'projects',
  'profile_questionnaires',
  'tracking_configs',
  'profile_measurement_types',
  'tags',
  'body_weights',
  'body_measurements',
  'food_logs',
  'meal_templates',
  'nutrition_targets',
  'water_logs',
  'exercises',
  'workout_plans',
  'workout_days',
  'workout_plan_exercises',
  'workout_sessions',
  'exercise_performances',
  'exercise_sets',
  'profile_exercise_settings',
  'cardio_sessions',
  'cardio_targets',
  'sleep_logs',
  'sleep_targets',
  'habit_definitions',
  'habit_logs',
] as const satisfies readonly (keyof DatabaseSchema)[];

/** Child tables without `profile_id`, read through their parent row. */
export const CHILD_EXPORT_TABLES = [
  'body_weight_tags',
  'body_measurement_values',
  'meal_template_items',
] as const satisfies readonly (keyof DatabaseSchema)[];

/** Child table → its parent table and the column that points to it. */
export const CHILD_PARENT = {
  body_weight_tags: { parent: 'body_weights', column: 'body_weight_id' },
  body_measurement_values: { parent: 'body_measurements', column: 'measurement_id' },
  meal_template_items: { parent: 'meal_templates', column: 'meal_template_id' },
} as const satisfies Record<(typeof CHILD_EXPORT_TABLES)[number], unknown>;

/** Shared catalogs: only the rows the profile references are exported. */
export const SHARED_EXPORT_TABLES = [
  'foods',
  'measurement_types',
] as const satisfies readonly (keyof DatabaseSchema)[];

export type ExportTable =
  | (typeof PROFILE_EXPORT_TABLES)[number]
  | (typeof CHILD_EXPORT_TABLES)[number]
  | (typeof SHARED_EXPORT_TABLES)[number];

export type ExportTables = { [K in ExportTable]: DatabaseSchema[K][] };

export type ProfileTables = {
  [
    K in (typeof PROFILE_EXPORT_TABLES)[number] | (typeof CHILD_EXPORT_TABLES)[number]
  ]: DatabaseSchema[K][];
};

export interface SharedIds {
  foodIds: string[];
  measurementTypeIds: string[];
  /** System exercises (no profile) used by the profile's plans and workouts. */
  exerciseIds: string[];
}

/** Reads one profile's rows; every query filters by `profile_id` or by a parent that does. */
export interface ExportRepository {
  /** The profile (not deleted) or null. */
  profile(profileId: string): Promise<ProfilesTable | null>;
  /** Every row of the profile, soft-deleted ones included; the use case picks what to export. */
  profileRows(profileId: string): Promise<ProfileTables>;
  /** Rows of the shared catalogs by id, plus the system exercises. */
  sharedRows(ids: SharedIds): Promise<{
    foods: DatabaseSchema['foods'][];
    measurement_types: DatabaseSchema['measurement_types'][];
    exercises: DatabaseSchema['exercises'][];
  }>;
}

/** Save dialogs and file writing in the main process; the renderer never sends paths. */
export interface ExportFiles {
  /** Asks where to save and writes the text. Returns the chosen file name, or null if cancelled. */
  saveJson(defaultFileName: string, content: string): Promise<string | null>;
  /** Asks where to save and writes a zip with these files. Null if cancelled. */
  saveZip(defaultFileName: string, files: Record<string, string>): Promise<string | null>;
}
