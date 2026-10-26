import type { Prescription } from './plan';
import type { SetValues } from './session';

type DoneSet = Pick<
  SetValues,
  'weightKg' | 'repetitions' | 'durationSeconds' | 'rir' | 'completed'
>;

export interface HistorySession {
  sessionId: string;
  startedAt: string;
  sets: (DoneSet & { setNumber: number })[];
}

export interface SessionStats {
  sessionId: string;
  startedAt: string;
  /** Heaviest completed set, or null without loads. */
  topWeightKg: number | null;
  /** Sum of load × reps of completed sets (0 without loads). */
  volumeKg: number;
}

export interface ExerciseHistoryStats {
  sessions: SessionStats[];
  bestLoad: { weightKg: number; startedAt: string } | null;
  bestSet: { weightKg: number; repetitions: number | null; startedAt: string } | null;
  /** Finished sessions with the exercise since `since`. */
  recentSessions: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

type BestSet = NonNullable<ExerciseHistoryStats['bestSet']>;

const beats = (set: DoneSet & { weightKg: number }, best: BestSet | null) =>
  !best ||
  set.weightKg > best.weightKg ||
  (set.weightKg === best.weightKg && (set.repetitions ?? 0) > (best.repetitions ?? 0));

/** Top load and volume of one session (completed sets with a load only). */
function statsOf(session: HistorySession): SessionStats {
  const loaded = session.sets.filter(
    (s): s is HistorySession['sets'][number] & { weightKg: number } =>
      s.completed && s.weightKg !== null,
  );
  return {
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    topWeightKg: loaded.length ? Math.max(...loaded.map((s) => s.weightKg)) : null,
    volumeKg: round2(loaded.reduce((total, s) => total + s.weightKg * (s.repetitions ?? 0), 0)),
  };
}

/**
 * Exercise history (README §10.5) from recorded values only: no estimates.
 * `sessions` come newest first; `since` is an ISO instant.
 */
export function exerciseHistory(
  sessions: readonly HistorySession[],
  since: string,
): ExerciseHistoryStats {
  const stats = sessions.map(statsOf);
  let bestLoad: ExerciseHistoryStats['bestLoad'] = null;
  for (const s of stats) {
    if (s.topWeightKg !== null && (!bestLoad || s.topWeightKg > bestLoad.weightKg)) {
      bestLoad = { weightKg: s.topWeightKg, startedAt: s.startedAt };
    }
  }
  let bestSet: BestSet | null = null;
  for (const session of sessions) {
    for (const set of session.sets) {
      if (!set.completed || set.weightKg === null) continue;
      const loaded = { ...set, weightKg: set.weightKg };
      if (beats(loaded, bestSet)) {
        bestSet = {
          weightKg: set.weightKg,
          repetitions: set.repetitions,
          startedAt: session.startedAt,
        };
      }
    }
  }
  return {
    sessions: stats,
    bestLoad,
    bestSet,
    recentSessions: sessions.filter((s) => s.startedAt >= since).length,
  };
}

/**
 * Double progression (README §10.6): every prescribed set was completed at the
 * top of the range (reps or seconds) with RIR inside its range, when one is
 * prescribed. Only a suggestion; the user decides.
 */
export function suggestsLoadIncrease(
  prescription: Prescription,
  lastSets: readonly DoneSet[],
): boolean {
  const done = lastSets.filter((s) => s.completed).slice(0, prescription.sets);
  if (done.length < prescription.sets) return false;
  const top = prescription.targetType === 'reps' ? prescription.maxReps : prescription.maxSeconds;
  if (top === null) return false;
  return done.every((s) => {
    const value = prescription.targetType === 'reps' ? s.repetitions : s.durationSeconds;
    if (value === null || value < top) return false;
    if (prescription.minRir === null || prescription.maxRir === null) return true;
    return s.rir !== null && s.rir >= prescription.minRir && s.rir <= prescription.maxRir;
  });
}
