import { daysBetween, parseLocalDate, type LocalDate } from '@evully/domain';

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in the device's time zone, for display logic on screens. */
export function localToday(now: Date = new Date()): LocalDate {
  return parseLocalDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
}

/** Local date of an ISO instant, in the device's time zone. */
export function localDateOf(iso: string): LocalDate {
  return localToday(new Date(iso));
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

/** Local date + `HH:mm` on this device → ISO 8601 UTC instant (README §6.2). */
export function localDateTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

/** ISO instant → `HH:mm` in this device's time zone. */
export function isoToLocalTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Current time as `HH:mm` on this device. */
export function localNowTime(now: Date = new Date()): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
