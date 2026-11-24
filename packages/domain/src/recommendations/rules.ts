import { daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import { suggestsLoadIncrease } from '../workouts/history';
import type { Prescription } from '../workouts/plan';
import type { SetValues } from '../workouts/session';

/**
 * Recommendation rules (README §20.2): deterministic, versioned, with fixed
 * limits. A signal states a fact from the records; it never changes data and
 * never gives medical advice (README §2.6).
 */
export const RECOMMENDATION_RULES = [
  'weight_missing',
  'measurements_missing',
  'double_progression',
] as const;
export type RecommendationRuleId = (typeof RECOMMENDATION_RULES)[number];

export type SignalLevel = 'info' | 'attention';

/** Version of each rule; changing a limit or the logic bumps it. */
export const RULE_VERSIONS: Record<RecommendationRuleId, number> = {
  weight_missing: 1,
  measurements_missing: 1,
  double_progression: 1,
};

/** Days without a record before the "missing" rules fire. */
export const MISSING_LIMIT_DAYS = { weight_missing: 7, measurements_missing: 21 } as const;

export interface MissingEvidence {
  lastDate: LocalDate;
  daysSince: number;
  limitDays: number;
}

export interface ProgressionEvidence {
  exerciseId: string;
  exerciseName: string;
  /** Local date of the session that met the criterion. */
  lastDate: LocalDate;
  targetType: Prescription['targetType'];
  sets: number;
  /** Top of the prescribed range (reps or seconds). */
  top: number;
  /** Completed values of that session, in set order. */
  values: number[];
  incrementKg: number | null;
}

export type Signal =
  | {
      ruleId: 'weight_missing';
      subjectKey: 'weight';
      level: SignalLevel;
      evidence: MissingEvidence;
    }
  | {
      ruleId: 'measurements_missing';
      subjectKey: 'measurements';
      level: SignalLevel;
      evidence: MissingEvidence;
    }
  | {
      ruleId: 'double_progression';
      /** The plan exercise the prescription belongs to. */
      subjectKey: string;
      level: SignalLevel;
      evidence: ProgressionEvidence;
    };

type DoneSet = Pick<
  SetValues,
  'weightKg' | 'repetitions' | 'durationSeconds' | 'rir' | 'completed'
>;

/** One exercise of an active plan with the sets of its latest finished session. */
export interface ProgressionCandidate {
  planExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  prescription: Prescription;
  last: { date: string; sets: readonly DoneSet[] } | null;
  incrementKg: number | null;
}

export interface RuleInputs {
  /** Local date of the latest weighing; null without any. */
  lastWeighing: string | null;
  /** Local date of the latest measuring session; null without any or without tracked measurements. */
  lastMeasurement: string | null;
  progressions: readonly ProgressionCandidate[];
}

function missing(last: string | null, limitDays: number, today: LocalDate): MissingEvidence | null {
  if (last === null) return null;
  const lastDate = parseLocalDate(last);
  const daysSince = daysBetween(lastDate, today);
  return daysSince >= limitDays ? { lastDate, daysSince, limitDays } : null;
}

function progression(candidate: ProgressionCandidate): Signal | null {
  const { prescription, last } = candidate;
  if (!last || !suggestsLoadIncrease(prescription, last.sets)) return null;
  // A load suggestion only makes sense for an exercise done with a load.
  if (!last.sets.some((s) => s.completed && s.weightKg !== null)) return null;
  const reps = prescription.targetType === 'reps';
  const top = reps ? prescription.maxReps : prescription.maxSeconds;
  if (top === null) return null;
  const values = last.sets
    .filter((s) => s.completed)
    .slice(0, prescription.sets)
    .map((s) => (reps ? s.repetitions : s.durationSeconds) ?? 0);
  return {
    ruleId: 'double_progression',
    subjectKey: candidate.planExerciseId,
    level: 'info',
    evidence: {
      exerciseId: candidate.exerciseId,
      exerciseName: candidate.exerciseName,
      lastDate: parseLocalDate(last.date),
      targetType: prescription.targetType,
      sets: prescription.sets,
      top,
      values,
      incrementKg: candidate.incrementKg,
    },
  };
}

/** Every signal the enabled rules find today, in rule order. */
export function evaluateRules(
  inputs: RuleInputs,
  today: LocalDate,
  disabled: readonly RecommendationRuleId[] = [],
): Signal[] {
  const on = (rule: RecommendationRuleId) => !disabled.includes(rule);
  const signals: Signal[] = [];
  const weight = missing(inputs.lastWeighing, MISSING_LIMIT_DAYS.weight_missing, today);
  if (on('weight_missing') && weight) {
    signals.push({
      ruleId: 'weight_missing',
      subjectKey: 'weight',
      level: 'info',
      evidence: weight,
    });
  }
  const measures = missing(inputs.lastMeasurement, MISSING_LIMIT_DAYS.measurements_missing, today);
  if (on('measurements_missing') && measures) {
    signals.push({
      ruleId: 'measurements_missing',
      subjectKey: 'measurements',
      level: 'info',
      evidence: measures,
    });
  }
  if (on('double_progression')) {
    for (const candidate of inputs.progressions) {
      const signal = progression(candidate);
      if (signal) signals.push(signal);
    }
  }
  return signals;
}
