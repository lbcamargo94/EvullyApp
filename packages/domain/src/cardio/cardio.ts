import { ValidationError } from '../errors';
import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import { isoWeekday } from '../workouts/session';

export const CARDIO_ACTIVITIES = ['walking', 'cycling', 'running', 'elliptical', 'custom'] as const;
export const CARDIO_INTENSITIES = ['light', 'moderate', 'vigorous'] as const;
export type CardioActivity = (typeof CARDIO_ACTIVITIES)[number];
export type CardioIntensity = (typeof CARDIO_INTENSITIES)[number];

export const MAX_CARDIO_MINUTES = 600;
export const MAX_CARDIO_KM = 300;
export const MAX_CARDIO_STEPS = 100_000;
export const ACTIVITY_NAME_MAX_LENGTH = 40;
export const CARDIO_NOTES_MAX_LENGTH = 280;

/** A cardio session as typed (README §11.1). Optional fields are null. */
export interface CardioDraft {
  sessionDate: string;
  startedAt: string;
  activityType: CardioActivity;
  /** Only for `custom`. */
  activityName: string | null;
  durationMinutes: number;
  distanceKm: number | null;
  steps: number | null;
  intensity: CardioIntensity | null;
  heartRateAverage: number | null;
  notes: string | null;
}

const invalid = (code: string) => new ValidationError(code, code);

function wholeIn(value: number | null, min: number, max: number, code: string): number | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < min || value > max) throw invalid(code);
  return value;
}

function activityName(draft: CardioDraft): string | null {
  if (draft.activityType !== 'custom') return null;
  const name = (draft.activityName ?? '').trim().replace(/\s+/g, ' ');
  if (!name) throw invalid('cardio.activity_name_required');
  if ([...name].length > ACTIVITY_NAME_MAX_LENGTH) throw invalid('cardio.activity_name_too_long');
  return name;
}

/** Validates a session: never in the future; the session's steps are only its own data. */
export function normalizeCardioDraft(
  draft: CardioDraft,
  today: LocalDate,
): Omit<CardioDraft, 'sessionDate'> & { sessionDate: LocalDate } {
  const sessionDate = parseLocalDate(draft.sessionDate);
  if (daysBetween(sessionDate, today) < 0) throw invalid('cardio.date_in_future');
  let distanceKm: number | null = null;
  if (draft.distanceKm !== null) {
    distanceKm = Math.round(draft.distanceKm * 100) / 100;
    if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > MAX_CARDIO_KM) {
      throw invalid('cardio.distance_out_of_range');
    }
  }
  const notes = draft.notes?.trim() || null;
  if (notes && [...notes].length > CARDIO_NOTES_MAX_LENGTH) throw invalid('cardio.notes_too_long');
  return {
    sessionDate,
    startedAt: draft.startedAt,
    activityType: draft.activityType,
    activityName: activityName(draft),
    durationMinutes: wholeIn(
      draft.durationMinutes,
      1,
      MAX_CARDIO_MINUTES,
      'cardio.duration_out_of_range',
    ) as number,
    distanceKm,
    steps: wholeIn(draft.steps, 0, MAX_CARDIO_STEPS, 'cardio.steps_out_of_range'),
    intensity: draft.intensity,
    heartRateAverage: wholeIn(draft.heartRateAverage, 30, 250, 'cardio.heart_rate_out_of_range'),
    notes,
  };
}

/** Monday of the week of `date` (weeks run Monday to Sunday). */
export function weekStartOf(date: LocalDate): LocalDate {
  return addDaysToLocalDate(date, 1 - isoWeekday(date));
}

export interface WeekSummary {
  weekStart: LocalDate;
  sessions: number;
  minutes: number;
  distanceKm: number;
  byActivity: {
    activityType: CardioActivity;
    activityName: string | null;
    sessions: number;
    minutes: number;
    distanceKm: number;
  }[];
}

type Summable = Pick<
  CardioDraft,
  'activityType' | 'activityName' | 'durationMinutes' | 'distanceKm'
> & {
  sessionDate: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Sessions, minutes and km of the week starting on `weekStart`, in total and per activity. */
export function weekSummary(sessions: readonly Summable[], weekStart: LocalDate): WeekSummary {
  const end = addDaysToLocalDate(weekStart, 7);
  const inWeek = sessions.filter((s) => s.sessionDate >= weekStart && s.sessionDate < end);
  const groups = new Map<string, WeekSummary['byActivity'][number]>();
  for (const s of inWeek) {
    const key = `${s.activityType}:${s.activityName ?? ''}`;
    const group = groups.get(key) ?? {
      activityType: s.activityType,
      activityName: s.activityName,
      sessions: 0,
      minutes: 0,
      distanceKm: 0,
    };
    group.sessions += 1;
    group.minutes += s.durationMinutes;
    group.distanceKm = round2(group.distanceKm + (s.distanceKm ?? 0));
    groups.set(key, group);
  }
  return {
    weekStart,
    sessions: inWeek.length,
    minutes: inWeek.reduce((total, s) => total + s.durationMinutes, 0),
    distanceKm: round2(inWeek.reduce((total, s) => total + (s.distanceKm ?? 0), 0)),
    byActivity: [...groups.values()],
  };
}

export const MAX_CARDIO_TARGET_SESSIONS = 14;
export const MAX_CARDIO_TARGET_MINUTES = 3000;

/** Weekly cardio target typed by the user (README §11.1); both null means no target. */
export interface CardioTargetValues {
  sessionsPerWeek: number | null;
  minutesPerWeek: number | null;
}

/** Whole numbers: 1–14 sessions and 1–3000 minutes per week; never computed by the app. */
export function normalizeCardioTarget(draft: CardioTargetValues): CardioTargetValues {
  return {
    sessionsPerWeek: wholeIn(
      draft.sessionsPerWeek,
      1,
      MAX_CARDIO_TARGET_SESSIONS,
      'cardio_target.out_of_range',
    ),
    minutesPerWeek: wholeIn(
      draft.minutesPerWeek,
      1,
      MAX_CARDIO_TARGET_MINUTES,
      'cardio_target.out_of_range',
    ),
  };
}
