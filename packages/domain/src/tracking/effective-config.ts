import { daysBetween, type LocalDate } from '../local-date';

export interface Effective {
  effectiveFrom: LocalDate;
  createdAt: string;
}

/**
 * The record in force on `date`: latest `effectiveFrom` not after it, ties broken
 * by the most recent `createdAt` and then by position (later in `records` wins), so
 * callers pass records in creation order (README §7.5). Null if none had started yet.
 */
export function effectiveAt<T extends Effective>(records: readonly T[], date: LocalDate): T | null {
  let current: T | null = null;
  for (const record of records) {
    if (daysBetween(record.effectiveFrom, date) < 0) continue;
    if (
      !current ||
      daysBetween(current.effectiveFrom, record.effectiveFrom) > 0 ||
      (record.effectiveFrom === current.effectiveFrom && record.createdAt >= current.createdAt)
    ) {
      current = record;
    }
  }
  return current;
}
