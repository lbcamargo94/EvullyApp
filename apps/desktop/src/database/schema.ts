/** Kysely table types. Tables are added here together with their migration. */

export interface ProfilesTable {
  id: string;
  name: string;
  birth_date: string | null;
  sex: 'male' | 'female' | null;
  height_cm: number | null;
  avatar_path: string | null;
  unit_system: 'metric';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SettingsTable {
  id: string;
  profile_id: string | null;
  key: string;
  /** JSON text. */
  value: string;
  created_at: string;
  updated_at: string;
}

export interface MeasurementTypesTable {
  id: string;
  code: string;
  name: string;
  body_region: 'waist' | 'hips' | 'arms' | 'legs' | 'chest' | 'other';
  unit: 'cm';
  instructions: string;
  csv_name: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectsTable {
  id: string;
  profile_id: string;
  name: string;
  objective: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'maintenance';
  start_date: string;
  target_date: string;
  status: 'active' | 'completed' | 'archived';
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProfileQuestionnairesTable {
  id: string;
  profile_id: string;
  questionnaire_code: string;
  questionnaire_version: string;
  /** JSON text. */
  answers: string;
  status: 'completed' | 'skipped';
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingConfigsTable {
  id: string;
  profile_id: string;
  effective_from: string;
  weight_display: 'trend' | 'daily' | 'hidden';
  /** JSON array text. */
  focus_areas: string;
  /** JSON array text. */
  enabled_modules: string;
  source: 'questionnaire' | 'manual' | 'template' | 'professional';
  rule_version: string | null;
  questionnaire_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileMeasurementTypesTable {
  id: string;
  profile_id: string;
  measurement_type_id: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

/** Household catalog: no profile_id (README §6.1). */
export interface FoodsTable {
  id: string;
  name: string;
  brand: string | null;
  reference_amount: number;
  reference_unit: 'g' | 'ml' | 'portion';
  calories_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fiber_g: number | null;
  sodium_mg: number | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FoodLogsTable {
  id: string;
  profile_id: string;
  log_date: string;
  meal_type:
    'breakfast' | 'morning_snack' | 'lunch' | 'pre_workout' | 'dinner' | 'supper' | 'custom';
  meal_name: string | null;
  food_id: string;
  /** JSON of the domain FoodSnapshot. */
  food_snapshot: string;
  quantity: number;
  calories_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fiber_g: number | null;
  sodium_mg: number | null;
  consumed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MealTemplatesTable {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MealTemplateItemsTable {
  id: string;
  meal_template_id: string;
  food_id: string;
  quantity: number;
  sort_order: number;
  created_at: string;
}

export interface TagsTable {
  id: string;
  profile_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BodyWeightsTable {
  id: string;
  profile_id: string;
  measured_on: string;
  measured_at: string;
  weight_kg: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BodyWeightTagsTable {
  body_weight_id: string;
  tag_id: string;
  created_at: string;
}

export interface BodyMeasurementsTable {
  id: string;
  profile_id: string;
  measured_on: string;
  measured_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BodyMeasurementValuesTable {
  id: string;
  measurement_id: string;
  measurement_type_id: string;
  value_cm: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  profiles: ProfilesTable;
  settings: SettingsTable;
  measurement_types: MeasurementTypesTable;
  projects: ProjectsTable;
  profile_questionnaires: ProfileQuestionnairesTable;
  tracking_configs: TrackingConfigsTable;
  profile_measurement_types: ProfileMeasurementTypesTable;
  tags: TagsTable;
  body_weights: BodyWeightsTable;
  body_weight_tags: BodyWeightTagsTable;
  body_measurements: BodyMeasurementsTable;
  body_measurement_values: BodyMeasurementValuesTable;
  foods: FoodsTable;
  food_logs: FoodLogsTable;
  meal_templates: MealTemplatesTable;
  meal_template_items: MealTemplateItemsTable;
}
