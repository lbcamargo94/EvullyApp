import type { HabitDraft, LocalDate } from '@evully/domain';

export interface HabitRecord extends HabitDraft {
  id: string;
  profileId: string;
  sortOrder: number;
}

export interface HabitLogRecord {
  habitId: string;
  logDate: LocalDate;
  value: number;
}

/** Every query is scoped by profile (README §6.1). */
export interface HabitRepository {
  /** Active habits in their order. */
  listActive(profileId: string): Promise<HabitRecord[]>;
  insert(habit: HabitRecord, now: string): Promise<void>;
  update(habit: HabitRecord, now: string): Promise<void>;
  /** Hides the habit; its logs stay. */
  deactivate(profileId: string, id: string, now: string): Promise<boolean>;
  reorder(profileId: string, ids: readonly string[], now: string): Promise<void>;
  /** Active logs from `from` to `to` (inclusive). */
  logsBetween(profileId: string, from: LocalDate, to: LocalDate): Promise<HabitLogRecord[]>;
  /** Active logs of one habit, oldest first. */
  logsOf(profileId: string, habitId: string): Promise<HabitLogRecord[]>;
  /** One log per habit per day: replaces the day's value. */
  saveLog(profileId: string, log: HabitLogRecord, newId: string, now: string): Promise<void>;
  clearLog(profileId: string, habitId: string, logDate: LocalDate, now: string): Promise<void>;
}
