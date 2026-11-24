import type { PlanSchedule, TrainingSession } from '../analytics/training';
import { daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import type { StatPoint } from '../stats/series';
import type { Objective } from '../tracking/types';
import {
  lowAdherence,
  rateOutsideBand,
  volumeDrop,
  weightPlateau,
  type AdherenceEvidence,
  type PlateauEvidence,
  type RateBandEvidence,
  type VolumeDropEvidence,
} from './body-training-rules';
import {
  progressionsByWorkout,
  type ProgressionCandidate,
  type ProgressionEvidence,
} from './progression-rule';
import {
  trackingSuggestions,
  type TrackingSuggestionEvidence,
  type TrackingSuggestionInputs,
} from './tracking-rule';

/**
 * Recommendation rules (README §20.2): deterministic, versioned, with fixed
 * limits. A signal states a fact from the records; it never changes data and
 * never gives medical advice (README §2.6).
 */
export const RECOMMENDATION_RULES = [
  'weight_missing',
  'measurements_missing',
  'double_progression',
  'weight_plateau',
  'weight_rate_out_of_band',
  'volume_drop',
  'low_adherence',
  'tracking_suggestion',
] as const;
export type RecommendationRuleId = (typeof RECOMMENDATION_RULES)[number];

export type SignalLevel = 'info' | 'attention';

/** Version of each rule; changing a limit or the logic bumps it. */
export const RULE_VERSIONS: Record<RecommendationRuleId, number> = {
  weight_missing: 1,
  measurements_missing: 1,
  // 2: one signal per workout instead of one per exercise.
  double_progression: 2,
  weight_plateau: 1,
  weight_rate_out_of_band: 1,
  volume_drop: 1,
  low_adherence: 1,
  tracking_suggestion: 1,
};

/** Days without a record before the "missing" rules fire. */
export const MISSING_LIMIT_DAYS = { weight_missing: 7, measurements_missing: 21 } as const;

export interface MissingEvidence {
  lastDate: LocalDate;
  daysSince: number;
  limitDays: number;
}

interface SignalOf<R extends RecommendationRuleId, E> {
  ruleId: R;
  subjectKey: string;
  level: SignalLevel;
  evidence: E;
}

export type Signal =
  | SignalOf<'weight_missing', MissingEvidence>
  | SignalOf<'measurements_missing', MissingEvidence>
  | SignalOf<'double_progression', ProgressionEvidence>
  | SignalOf<'weight_plateau', PlateauEvidence>
  | SignalOf<'weight_rate_out_of_band', RateBandEvidence>
  | SignalOf<'volume_drop', VolumeDropEvidence>
  | SignalOf<'low_adherence', AdherenceEvidence>
  | SignalOf<'tracking_suggestion', TrackingSuggestionEvidence>;

export interface RuleInputs {
  /** Local date of the latest weighing; null without any. */
  lastWeighing: string | null;
  /** Local date of the latest measuring session; null without any or without tracked measurements. */
  lastMeasurement: string | null;
  progressions: readonly ProgressionCandidate[];
  /** One weight per day. */
  weights: readonly StatPoint[];
  /** Objective of the active project; null without one. */
  objective: Objective | null;
  /** Pace band of the active project, kg/week; null when not set. */
  rateBand: { minKg: number; maxKg: number } | null;
  /** Finished workouts by local date. */
  sessions: readonly TrainingSession[];
  /** Weekdays of the active plans since each was created. */
  plans: readonly PlanSchedule[];
  /** Tracked measurements with their values and the untracked catalog ones. */
  measurements: TrackingSuggestionInputs;
}

function missing(last: string | null, limitDays: number, today: LocalDate): MissingEvidence | null {
  if (last === null) return null;
  const lastDate = parseLocalDate(last);
  const daysSince = daysBetween(lastDate, today);
  return daysSince >= limitDays ? { lastDate, daysSince, limitDays } : null;
}

/** Each rule: the evidence it finds today, keyed by what it is about. */
function findings(inputs: RuleInputs, today: LocalDate): Signal[] {
  const one = <R extends RecommendationRuleId, E>(
    ruleId: R,
    subjectKey: string,
    level: SignalLevel,
    evidence: E | null,
  ): SignalOf<R, E>[] => (evidence ? [{ ruleId, subjectKey, level, evidence }] : []);
  return [
    ...one(
      'weight_missing',
      'weight',
      'info',
      missing(inputs.lastWeighing, MISSING_LIMIT_DAYS.weight_missing, today),
    ),
    ...one(
      'measurements_missing',
      'measurements',
      'info',
      missing(inputs.lastMeasurement, MISSING_LIMIT_DAYS.measurements_missing, today),
    ),
    ...progressionsByWorkout(inputs.progressions).map((evidence): Signal => ({
      ruleId: 'double_progression',
      subjectKey: evidence.lastDate,
      level: 'info',
      evidence,
    })),
    ...one(
      'weight_plateau',
      'weight',
      'info',
      weightPlateau(inputs.weights, inputs.objective, today),
    ),
    ...one(
      'weight_rate_out_of_band',
      'weight',
      'attention',
      rateOutsideBand(inputs.weights, inputs.rateBand, today),
    ),
    ...one('volume_drop', 'training', 'info', volumeDrop(inputs.sessions, today)),
    ...one('low_adherence', 'training', 'info', lowAdherence(inputs.sessions, inputs.plans, today)),
    ...trackingSuggestions(inputs.measurements, today).map((evidence): Signal => ({
      ruleId: 'tracking_suggestion',
      subjectKey: evidence.suggestedCode,
      level: 'info',
      evidence,
    })),
  ];
}

/** Every signal the enabled rules find today, in rule order. */
export function evaluateRules(
  inputs: RuleInputs,
  today: LocalDate,
  disabled: readonly RecommendationRuleId[] = [],
): Signal[] {
  return findings(inputs, today).filter((s) => !disabled.includes(s.ruleId));
}
