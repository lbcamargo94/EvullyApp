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

export interface DatabaseSchema {
  profiles: ProfilesTable;
  settings: SettingsTable;
}
