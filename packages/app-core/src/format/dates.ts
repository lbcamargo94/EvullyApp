import { daysBetween, parseLocalDate, type LocalDate } from '@evully/domain';

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in the device's time zone, for display logic on screens. */
export function localToday(now: Date = new Date()): LocalDate {
  return parseLocalDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
}

/** `2026-12-06` → `06/12/2026` (README §16.1). */
export function formatLocalDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

/** Adds whole days to a local date. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return parseLocalDate(d.toISOString().slice(0, 10));
}

/** Days in a project counting the start day (README §7.1), or null while dates are invalid. */
export function projectLength(startDate: string, targetDate: string): number | null {
  try {
    const days = daysBetween(parseLocalDate(startDate), parseLocalDate(targetDate)) + 1;
    return days > 0 ? days : null;
  } catch {
    return null;
  }
}
