import type { LocalDate } from '@evully/domain';

export interface MeasurementValueRecord {
  measurementTypeId: string;
  code: string;
  name: string;
  valueCm: number;
}

export interface MeasurementSessionRecord {
  id: string;
  profileId: string;
  measuredOn: LocalDate;
  measuredAt: string;
  notes: string | null;
  values: MeasurementValueRecord[];
  createdAt: string;
  updatedAt: string;
}

export type MeasurementSessionData = Omit<MeasurementSessionRecord, 'values'>;
export interface NewValue {
  id: string;
  measurementTypeId: string;
  valueCm: number;
}

/** Every method is scoped by `profileId`; records of other profiles are never visible. */
export interface MeasurementRepository {
  /** Inserts the session and its values in one transaction. */
  insert(session: MeasurementSessionData, values: readonly NewValue[]): Promise<void>;
  /** Updates the session and replaces its values in one transaction. */
  update(session: MeasurementSessionData, values: readonly NewValue[]): Promise<void>;
  /** Soft delete; false if the session does not exist for this profile. */
  softDelete(profileId: string, id: string, deletedAt: string): Promise<boolean>;
  findById(profileId: string, id: string): Promise<MeasurementSessionRecord | null>;
  /** Active sessions, most recent first. */
  listByProfile(profileId: string): Promise<MeasurementSessionRecord[]>;
}
