import { ValidationError } from './errors';

/** A calendar date in the user's local time, formatted `YYYY-MM-DD` (README §6.2). */
export type LocalDate = string & { readonly __brand: 'LocalDate' };

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function parseLocalDate(value: string): LocalDate {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) throw new ValidationError('date.invalid_format', `Invalid local date: ${value}`);
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const asUtc = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls over invalid days (e.g. 2026-09-31 → 2026-10-01); reject those.
  if (asUtc.getUTCMonth() !== month - 1 || asUtc.getUTCDate() !== day) {
    throw new ValidationError('date.invalid', `Invalid local date: ${value}`);
  }
  return value as LocalDate;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

/** The date `days` after `date` (negative goes back). */
export function addDaysToLocalDate(date: LocalDate, days: number): LocalDate {
  return new Date(Date.parse(date) + days * MS_PER_DAY).toISOString().slice(0, 10) as LocalDate;
}
