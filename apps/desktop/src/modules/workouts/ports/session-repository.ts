import type { SetValues } from '@evully/domain';

export interface SetRecord extends SetValues {
  id: string;
  setNumber: number;
}

export interface PerformanceRecord {
  id: string;
  exerciseId: string;
  planExerciseId: string | null;
  sortOrder: number;
  sets: SetRecord[];
}

export interface SessionRecord {
  id: string;
  profileId: string;
  workoutDayId: string | null;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  performances: PerformanceRecord[];
}

export interface NewPerformance {
  id: string;
  exerciseId: string;
  planExerciseId: string | null;
  /** Prefilled loads of the planned sets (null = empty). */
  sets: { id: string; weightKg: number | null }[];
}

/** Every query is scoped by profile (README §6.1). */
export interface SessionRepository {
  /** The profile's session that was started and not finished, if any. */
  findOpen(profileId: string): Promise<SessionRecord | null>;
  findById(profileId: string, id: string): Promise<SessionRecord | null>;
  /** Sets of the latest finished session with the exercise, and its date. */
  lastPerformance(
    profileId: string,
    exerciseId: string,
    beforeSessionId: string,
  ): Promise<{ startedAt: string; sets: SetRecord[] } | null>;
  /** Finished sessions with the exercise, newest first, with their sets. */
  history(
    profileId: string,
    exerciseId: string,
  ): Promise<{ sessionId: string; startedAt: string; sets: SetRecord[] }[]>;
  /** Every finished session with the sets of each exercise, oldest first. */
  finishedSessions(profileId: string): Promise<
    {
      id: string;
      startedAt: string;
      exercises: { exerciseId: string; sets: SetRecord[] }[];
    }[]
  >;
  insertSession(
    session: { id: string; profileId: string; workoutDayId: string | null; startedAt: string },
    performances: NewPerformance[],
  ): Promise<void>;
  addPerformance(
    profileId: string,
    sessionId: string,
    performance: NewPerformance,
    now: string,
  ): Promise<void>;
  removePerformance(profileId: string, id: string, now: string): Promise<void>;
  addSet(
    profileId: string,
    performanceId: string,
    set: { id: string; weightKg: number | null },
    now: string,
  ): Promise<void>;
  updateSet(profileId: string, id: string, values: SetValues, now: string): Promise<void>;
  removeSet(profileId: string, id: string, now: string): Promise<void>;
  /** Session id of a performance or set, or null when not the profile's. */
  sessionOfPerformance(profileId: string, id: string): Promise<string | null>;
  sessionOfSet(profileId: string, id: string): Promise<string | null>;
  finish(profileId: string, id: string, notes: string | null, now: string): Promise<void>;
  discard(profileId: string, id: string, now: string): Promise<void>;
}
