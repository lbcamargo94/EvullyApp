import { ValidationError } from './errors';
import { daysBetween, type LocalDate } from './local-date';

export type ProjectTimeline =
  | { status: 'not_started'; totalDays: number; daysUntilStart: number }
  | { status: 'in_progress'; day: number; totalDays: number; daysLeft: number }
  | { status: 'ended'; totalDays: number; daysSinceEnd: number };

/**
 * Where `today` falls in a project (README §7.1). The start date is day 1,
 * so 2026-10-05 → 2026-12-06 has 63 days.
 */
export function projectTimeline(
  startDate: LocalDate,
  targetDate: LocalDate,
  today: LocalDate,
): ProjectTimeline {
  if (daysBetween(startDate, targetDate) < 0) {
    throw new ValidationError('project.target_before_start', 'Target date is before start date');
  }
  const totalDays = daysBetween(startDate, targetDate) + 1;
  const elapsed = daysBetween(startDate, today);

  if (elapsed < 0) return { status: 'not_started', totalDays, daysUntilStart: -elapsed };
  if (elapsed >= totalDays) {
    return { status: 'ended', totalDays, daysSinceEnd: daysBetween(targetDate, today) };
  }
  return {
    status: 'in_progress',
    day: elapsed + 1,
    totalDays,
    daysLeft: daysBetween(today, targetDate),
  };
}
