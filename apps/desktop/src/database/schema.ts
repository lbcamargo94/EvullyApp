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

export interface TagsTable {
  id: string;
  profile_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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
}
