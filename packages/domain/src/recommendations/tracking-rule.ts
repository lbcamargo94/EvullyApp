import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import type { StatPoint } from '../stats/series';

/**
 * Tracking suggestion (README §20.2): a tracked measurement that barely moved
 * suggests a related one the profile does not track yet. Fixed pairs and
 * limits; accepting it is the user's decision.
 */
export const TRACKING_SUGGESTION_LIMITS = {
  /** Window read, in days: holds two sessions when measuring every 2 weeks. */
  days: 28,
  /** Minimum span between the first and last value in the window. */
  minSpanDays: 14,
  /** Maximum change (highest − lowest value) still considered stable. */
  limitCm: 0.5,
} as const;

/** Tracked measurement code → the related code it suggests, in priority order. */
export const TRACKING_SUGGESTION_PAIRS: readonly (readonly [string, string])[] = [
  ['waist', 'hips'],
  ['abdomen', 'hips'],
  ['hips', 'waist'],
  ['chest', 'right_arm'],
  ['right_arm', 'chest'],
  ['left_arm', 'chest'],
  ['right_thigh', 'right_calf'],
  ['left_thigh', 'left_calf'],
];

export interface MeasurementSeries {
  code: string;
  name: string;
  /** One value per measuring day, in cm. */
  points: readonly StatPoint[];
}

export interface TrackingSuggestionInputs {
  /** Measurements the profile tracks, with their values. */
  tracked: readonly MeasurementSeries[];
  /** Catalog measurements the profile does not track. */
  untracked: readonly { code: string; name: string }[];
}

export interface TrackingSuggestionEvidence {
  sourceCode: string;
  sourceName: string;
  suggestedCode: string;
  suggestedName: string;
  firstDate: LocalDate;
  lastDate: LocalDate;
  values: number;
  changeCm: number;
  days: number;
  minSpanDays: number;
  limitCm: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Stable values of one series in the window, or null. */
function stable(points: readonly StatPoint[], today: LocalDate) {
  const { days, minSpanDays, limitCm } = TRACKING_SUGGESTION_LIMITS;
  const from = addDaysToLocalDate(today, -days);
  const recent = points
    .filter((p) => p.date >= from && p.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = recent[0];
  const last = recent.at(-1);
  if (!first || !last || recent.length < 2) return null;
  const firstDate = parseLocalDate(first.date);
  const lastDate = parseLocalDate(last.date);
  if (daysBetween(firstDate, lastDate) < minSpanDays) return null;
  const values = recent.map((p) => p.value);
  const changeCm = round1(Math.max(...values) - Math.min(...values));
  return changeCm < limitCm ? { firstDate, lastDate, values: recent.length, changeCm } : null;
}

/** One suggestion per untracked measurement, from the first stable pair. */
export function trackingSuggestions(
  inputs: TrackingSuggestionInputs,
  today: LocalDate,
): TrackingSuggestionEvidence[] {
  const tracked = new Map(inputs.tracked.map((s) => [s.code, s]));
  const untracked = new Map(inputs.untracked.map((t) => [t.code, t]));
  const found = new Map<string, TrackingSuggestionEvidence>();
  for (const [sourceCode, suggestedCode] of TRACKING_SUGGESTION_PAIRS) {
    const source = tracked.get(sourceCode);
    const suggested = untracked.get(suggestedCode);
    if (!source || !suggested || found.has(suggestedCode)) continue;
    const window = stable(source.points, today);
    if (!window) continue;
    found.set(suggestedCode, {
      sourceCode,
      sourceName: source.name,
      suggestedCode,
      suggestedName: suggested.name,
      ...window,
      days: TRACKING_SUGGESTION_LIMITS.days,
      minSpanDays: TRACKING_SUGGESTION_LIMITS.minSpanDays,
      limitCm: TRACKING_SUGGESTION_LIMITS.limitCm,
    });
  }
  return [...found.values()];
}
