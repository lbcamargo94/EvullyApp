import type { LocalDate, NutritionTargetValues } from '@evully/domain';

export interface NutritionTargetRecord extends NutritionTargetValues {
  id: string;
  profileId: string;
  effectiveFrom: LocalDate;
  createdAt: string;
}

export interface WaterLogRecord {
  id: string;
  profileId: string;
  logDate: LocalDate;
  amountMl: number;
  loggedAt: string;
}

/** Every query is scoped by profile (README §6.1). */
export interface NutritionTargetRepository {
  /** All targets of the profile in creation order (for effectiveAt). */
  list(profileId: string): Promise<NutritionTargetRecord[]>;
  insert(target: NutritionTargetRecord): Promise<void>;
}

export interface WaterLogRepository {
  listDay(profileId: string, date: LocalDate): Promise<WaterLogRecord[]>;
  findById(profileId: string, id: string): Promise<WaterLogRecord | null>;
  insert(log: WaterLogRecord, now: string): Promise<void>;
  softDelete(profileId: string, id: string, now: string): Promise<boolean>;
}
