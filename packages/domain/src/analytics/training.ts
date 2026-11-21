import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import { MUSCLE_GROUPS, type MuscleGroup } from '../workouts/exercise';
import { isoWeekday } from '../workouts/session';
import {
  inRange,
  windowRanges,
  type AnalyticsMethod,
  type AnalyticsWindow,
  type DateRange,
  type PeriodComparison,
} from './windows';

/**
 * Training in a window (README §20.1): finished workouts, completed sets and
 * volume (load × repetitions), per primary muscle group only; plan adherence
 * against the weekdays of the active plans from the day each was created;
 * records from measured sets only, never an estimated 1RM.
 */
export const TRAINING_WINDOW_METHOD: AnalyticsMethod = { id: 'training.window', version: 1 };

export interface LoadedSet {
  weightKg: number;
  repetitions: number | null;
}

export interface TrainingSession {
  /** Local date the workout started. */
  date: string;
  exercises: readonly {
    exerciseId: string;
    name: string;
    muscleGroup: MuscleGroup;
    volumeKg: number;
    completedSets: number;
    loadedSets: readonly LoadedSet[];
  }[];
}

export interface PlanSchedule {
  /** ISO weekdays (1 = Monday) of the plan's days. */
  weekdays: readonly number[];
  /** Local date the plan was created; days before it are not planned. */
  since: string;
}

/**
 * A measured personal record: a load above every earlier one of the exercise
 * ("load"), or more repetitions than ever with a load already used ("reps").
 * The first workout with an exercise sets no record.
 */
export interface PersonalRecord {
  date: LocalDate;
  exerciseId: string;
  name: string;
  kind: 'load' | 'reps';
  weightKg: number;
  repetitions: number | null;
  /** Earlier best: the heaviest load ("load") or the most repetitions with this load ("reps"). */
  previous: number;
}

export interface MuscleGroupWindow {
  muscleGroup: MuscleGroup;
  sets: number;
  volumeKg: number;
  /** Workouts in which the group was trained. */
  workouts: number;
}

export interface TrainingWindow {
  workouts: number;
  sets: number;
  volumeKg: number;
  /** Null when no active plan had a planned day in the window. */
  adherence: { done: number; planned: number } | null;
  groups: MuscleGroupWindow[];
  records: PersonalRecord[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

interface ExerciseBest {
  maxWeight: number;
  repsAt: Map<number, number>;
}

/** The record set by a session's sets against the earlier best, if any. */
function recordOf(
  sets: readonly LoadedSet[],
  best: ExerciseBest,
): Pick<PersonalRecord, 'kind' | 'weightKg' | 'repetitions' | 'previous'> | null {
  const heaviest = sets.reduce<LoadedSet | null>(
    (top, s) =>
      !top ||
      s.weightKg > top.weightKg ||
      (s.weightKg === top.weightKg && (s.repetitions ?? 0) > (top.repetitions ?? 0))
        ? s
        : top,
    null,
  );
  if (heaviest && heaviest.weightKg > best.maxWeight) {
    return { kind: 'load', ...heaviest, previous: best.maxWeight };
  }
  const repsRecords = sets
    .filter((s) => {
      const earlier = best.repsAt.get(s.weightKg);
      return earlier !== undefined && (s.repetitions ?? 0) > earlier;
    })
    .sort((a, b) => b.weightKg - a.weightKg || (b.repetitions ?? 0) - (a.repetitions ?? 0));
  const top = repsRecords[0];
  if (!top) return null;
  return { kind: 'reps', ...top, previous: best.repsAt.get(top.weightKg) ?? 0 };
}

function remember(best: ExerciseBest | undefined, sets: readonly LoadedSet[]): ExerciseBest {
  const next = best ?? { maxWeight: -Infinity, repsAt: new Map<number, number>() };
  for (const s of sets) {
    next.maxWeight = Math.max(next.maxWeight, s.weightKg);
    next.repsAt.set(s.weightKg, Math.max(next.repsAt.get(s.weightKg) ?? 0, s.repetitions ?? 0));
  }
  return next;
}

/** Records set inside the range, scanning every workout up to its end, oldest first. */
export function personalRecords(
  sessions: readonly TrainingSession[],
  range: DateRange,
): PersonalRecord[] {
  const bests = new Map<string, ExerciseBest>();
  const records: PersonalRecord[] = [];
  for (const session of sessions) {
    const date = parseLocalDate(session.date);
    if (daysBetween(date, range.to) < 0) break;
    const inside = daysBetween(range.from, date) >= 0;
    for (const exercise of session.exercises) {
      if (exercise.loadedSets.length === 0) continue;
      const best = bests.get(exercise.exerciseId);
      const record = best && inside ? recordOf(exercise.loadedSets, best) : null;
      if (record) {
        records.push({ date, exerciseId: exercise.exerciseId, name: exercise.name, ...record });
      }
      bests.set(exercise.exerciseId, remember(best, exercise.loadedSets));
    }
  }
  return records;
}

/** Planned days of the active plans in the range, and the workouts done on the planned stretch. */
function adherence(
  sessions: readonly TrainingSession[],
  plans: readonly PlanSchedule[],
  range: DateRange,
): TrainingWindow['adherence'] {
  let planned = 0;
  let firstPlanned: LocalDate | null = null;
  for (const plan of plans) {
    const since = parseLocalDate(plan.since);
    const from = daysBetween(range.from, since) > 0 ? since : range.from;
    for (let day = from; daysBetween(day, range.to) >= 0; day = addDaysToLocalDate(day, 1)) {
      if (!plan.weekdays.includes(isoWeekday(day))) continue;
      planned += 1;
      if (!firstPlanned || daysBetween(day, firstPlanned) > 0) firstPlanned = day;
    }
  }
  if (planned === 0 || !firstPlanned) return null;
  const done = inRange(sessions, { from: firstPlanned, to: range.to }).length;
  return { done, planned };
}

function trainingWindow(
  sessions: readonly TrainingSession[],
  plans: readonly PlanSchedule[],
  range: DateRange,
): TrainingWindow {
  const inside = inRange(sessions, range);
  const groups = new Map<MuscleGroup, MuscleGroupWindow>();
  for (const session of inside) {
    const trained = new Set<MuscleGroup>();
    for (const e of session.exercises) {
      const group = groups.get(e.muscleGroup) ?? {
        muscleGroup: e.muscleGroup,
        sets: 0,
        volumeKg: 0,
        workouts: 0,
      };
      group.sets += e.completedSets;
      group.volumeKg = round2(group.volumeKg + e.volumeKg);
      if (!trained.has(e.muscleGroup)) group.workouts += 1;
      trained.add(e.muscleGroup);
      groups.set(e.muscleGroup, group);
    }
  }
  const byGroup = MUSCLE_GROUPS.flatMap((g) => {
    const group = groups.get(g);
    return group ? [group] : [];
  });
  return {
    workouts: inside.length,
    sets: byGroup.reduce((sum, g) => sum + g.sets, 0),
    volumeKg: round2(byGroup.reduce((sum, g) => sum + g.volumeKg, 0)),
    adherence: adherence(sessions, plans, range),
    groups: byGroup,
    records: personalRecords(sessions, range),
  };
}

/** Training of the last `days` days against the `days` before them. */
export function trainingComparison(
  sessions: readonly TrainingSession[],
  plans: readonly PlanSchedule[],
  days: AnalyticsWindow,
  today: LocalDate,
): PeriodComparison<TrainingWindow> {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const ranges = windowRanges(days, today);
  return {
    method: TRAINING_WINDOW_METHOD,
    current: trainingWindow(sorted, plans, ranges.current),
    previous: trainingWindow(sorted, plans, ranges.previous),
  };
}
