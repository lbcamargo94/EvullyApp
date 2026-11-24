import { parseLocalDate, type LocalDate } from '../local-date';
import { suggestsLoadIncrease } from '../workouts/history';
import type { Prescription } from '../workouts/plan';
import type { SetValues } from '../workouts/session';

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

export interface ProgressedExercise {
  exerciseId: string;
  exerciseName: string;
  targetType: Prescription['targetType'];
  sets: number;
  /** Top of the prescribed range (reps or seconds). */
  top: number;
  /** Completed values of that session, in set order. */
  values: number[];
  incrementKg: number | null;
}

/** Version 2: the exercises of one workout that met the criterion, together. */
export interface ProgressionEvidence {
  /** Local date of the workout. */
  lastDate: LocalDate;
  exercises: ProgressedExercise[];
}

function progressed(candidate: ProgressionCandidate): ProgressedExercise | null {
  const { prescription, last } = candidate;
  if (!last || !suggestsLoadIncrease(prescription, last.sets)) return null;
  // A load suggestion only makes sense for an exercise done with a load.
  if (!last.sets.some((s) => s.completed && s.weightKg !== null)) return null;
  const reps = prescription.targetType === 'reps';
  const top = reps ? prescription.maxReps : prescription.maxSeconds;
  if (top === null) return null;
  return {
    exerciseId: candidate.exerciseId,
    exerciseName: candidate.exerciseName,
    targetType: prescription.targetType,
    sets: prescription.sets,
    top,
    values: last.sets
      .filter((s) => s.completed)
      .slice(0, prescription.sets)
      .map((s) => (reps ? s.repetitions : s.durationSeconds) ?? 0),
    incrementKg: candidate.incrementKg,
  };
}

/**
 * Double progression (README §10.6), grouped by workout: one piece of
 * evidence per day whose exercises met the criterion, oldest first. An
 * exercise in two plan days counts once.
 */
export function progressionsByWorkout(
  candidates: readonly ProgressionCandidate[],
): ProgressionEvidence[] {
  const byDate = new Map<string, ProgressedExercise[]>();
  for (const candidate of candidates) {
    const exercise = progressed(candidate);
    if (!exercise || !candidate.last) continue;
    const list = byDate.get(candidate.last.date) ?? [];
    if (!list.some((e) => e.exerciseId === exercise.exerciseId)) list.push(exercise);
    byDate.set(candidate.last.date, list);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, exercises]) => ({ lastDate: parseLocalDate(date), exercises }));
}
