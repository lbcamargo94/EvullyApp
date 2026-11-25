import { daysBetween, type LocalDate } from '../local-date';
import { isoWeekday } from '../workouts/session';

/**
 * Local reminders (README §25): deterministic, once per type and day, never
 * redundant and never made up when data is missing.
 */
export const REMINDER_TYPES = ['weighing', 'measurements', 'workout'] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export interface ReminderPreference {
  type: ReminderType;
  enabled: boolean;
  /** Local `HH:mm`. */
  time: string;
  /** ISO weekday; measurements only. */
  weekday: number | null;
}

export interface QuietHours {
  start: string;
  end: string;
}

/** Days since the last measuring session before a measurements reminder shows. */
export const MEASUREMENTS_REMINDER_GAP_DAYS = 7;

/** Default preferences: every reminder off (README §25). */
export const DEFAULT_REMINDER_PREFERENCES: readonly ReminderPreference[] = [
  { type: 'weighing', enabled: false, time: '07:00', weekday: null },
  { type: 'measurements', enabled: false, time: '07:30', weekday: 1 },
  { type: 'workout', enabled: false, time: '18:00', weekday: null },
];

/** What the records say today; null where the profile has nothing to go on. */
export interface ReminderFacts {
  weighedToday: boolean;
  /** Latest measuring session; null without any. */
  lastMeasurement: LocalDate | null;
  tracksMeasurements: boolean;
  /** Names of the active plans' days planned for today. */
  plannedToday: readonly string[];
  /** A workout was started or finished today. */
  trainedToday: boolean;
}

export type DueReminder =
  { type: 'weighing' } | { type: 'measurements' } | { type: 'workout'; dayNames: string[] };

export interface DueInput {
  preferences: readonly ReminderPreference[];
  quietHours: QuietHours | null;
  facts: ReminderFacts;
  today: LocalDate;
  /** Local `HH:mm` now. */
  now: string;
  /** Types already shown today. */
  shownToday: readonly ReminderType[];
}

/** True when `time` is inside the quiet window, which may cross midnight. */
export function inQuietHours(time: string, quiet: QuietHours | null): boolean {
  if (!quiet || quiet.start === quiet.end) return false;
  return quiet.start < quiet.end
    ? time >= quiet.start && time < quiet.end
    : time >= quiet.start || time < quiet.end;
}

/** The reminder when its record is still missing today; null otherwise. */
function stillUseful(type: ReminderType, facts: ReminderFacts, today: LocalDate) {
  switch (type) {
    case 'weighing':
      return facts.weighedToday ? null : { type };
    case 'measurements':
      return facts.tracksMeasurements &&
        (facts.lastMeasurement === null ||
          daysBetween(facts.lastMeasurement, today) >= MEASUREMENTS_REMINDER_GAP_DAYS)
        ? { type }
        : null;
    case 'workout':
      return facts.plannedToday.length > 0 && !facts.trainedToday
        ? { type, dayNames: [...facts.plannedToday] }
        : null;
  }
}

/** Reminders to show now: enabled, past their time, outside quiet hours, not shown today. */
export function dueReminders(input: DueInput): DueReminder[] {
  if (inQuietHours(input.now, input.quietHours)) return [];
  const weekday = isoWeekday(input.today);
  return input.preferences.flatMap((p) => {
    if (!p.enabled || p.time > input.now || input.shownToday.includes(p.type)) return [];
    if (p.type === 'measurements' && p.weekday !== weekday) return [];
    const due = stillUseful(p.type, input.facts, input.today);
    return due ? [due] : [];
  });
}
