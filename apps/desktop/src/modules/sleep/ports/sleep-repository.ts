import type { NormalizedSleep } from '@evully/domain';

export interface SleepRecord extends NormalizedSleep {
  id: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
}

/** Every query is scoped by profile (README §6.1). */
export interface SleepRepository {
  /** Active nights, newest first. */
  list(profileId: string): Promise<SleepRecord[]>;
  findById(profileId: string, id: string): Promise<SleepRecord | null>;
  findByDate(profileId: string, sleepDate: string): Promise<SleepRecord | null>;
  insert(night: SleepRecord): Promise<void>;
  update(night: SleepRecord): Promise<void>;
  softDelete(profileId: string, id: string, now: string): Promise<boolean>;
}
