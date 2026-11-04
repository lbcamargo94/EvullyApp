import type { ExerciseHistoryDto, WorkoutStats } from '@evully/contracts';
import {
  addDaysToLocalDate,
  exerciseHistory,
  NotFoundError,
  sessionStats,
  ValidationError,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { SessionDeps } from './workout-sessions';

const RECENT_DAYS = 28;
const MAX_INCREMENT_KG = 50;

/** Increment in use for the profile: its own setting, else the exercise's (README §10.6). */
export async function effectiveIncrement(
  deps: SessionDeps,
  profileId: string,
  exerciseId: string,
): Promise<number | null> {
  const own = await deps.exercises.profileIncrement(profileId, exerciseId);
  if (own !== null) return own;
  const exercise = (await deps.exercises.listAll(profileId)).find((e) => e.id === exerciseId);
  return exercise?.loadIncrementKg ?? null;
}

async function visibleExercise(deps: SessionDeps, profileId: string, exerciseId: string) {
  const exercise = (await deps.exercises.listAll(profileId)).find((e) => e.id === exerciseId);
  if (!exercise) throw new NotFoundError('exercise.not_found', 'Exercise not found');
  return exercise;
}

/** History of one exercise for the profile (README §10.5). */
export class GetExerciseHistory {
  constructor(private readonly deps: SessionDeps) {}

  async execute({
    profileId,
    exerciseId,
  }: {
    profileId: string;
    exerciseId: string;
  }): Promise<ExerciseHistoryDto> {
    const { profiles, sessions, clock } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    await visibleExercise(this.deps, profileId, exerciseId);
    const raw = await sessions.history(profileId, exerciseId);
    const since = clock.localToIso(addDaysToLocalDate(clock.today(), -(RECENT_DAYS - 1)), '00:00');
    const stats = exerciseHistory(raw, since);
    return {
      exerciseId,
      loadIncrementKg: await effectiveIncrement(this.deps, profileId, exerciseId),
      profileIncrementKg: await this.deps.exercises.profileIncrement(profileId, exerciseId),
      bestLoad: stats.bestLoad,
      bestSet: stats.bestSet,
      recentSessions: stats.recentSessions,
      sessions: stats.sessions.map((s, i) => ({
        ...s,
        sets: (raw[i]?.sets ?? [])
          .filter((set) => set.completed)
          .map(({ setNumber, weightKg, repetitions, durationSeconds, rir }) => ({
            setNumber,
            weightKg,
            repetitions,
            durationSeconds,
            rir,
          })),
      })),
    };
  }
}

/** Finished sessions with the top load and volume per exercise (README §13.2). */
export class GetWorkoutStats {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<WorkoutStats> {
    const { profiles, sessions, exercises } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const names = new Map((await exercises.listAll(profileId)).map((e) => [e.id, e.name]));
    return (await sessions.finishedSessions(profileId)).map((session) => ({
      startedAt: session.startedAt,
      dayId: session.workoutDayId,
      exercises: session.exercises.flatMap(({ exerciseId, sets }) => {
        const name = names.get(exerciseId);
        if (name === undefined) return [];
        const { topWeightKg, volumeKg } = sessionStats({
          sessionId: session.id,
          startedAt: session.startedAt,
          sets,
        });
        return [{ exerciseId, name, topWeightKg, volumeKg }];
      }),
    }));
  }
}

/** The profile's load increment for an exercise; null clears it. */
export class SetExerciseIncrement {
  constructor(private readonly deps: SessionDeps) {}

  async execute(input: { profileId: string; exerciseId: string; loadIncrementKg: number | null }) {
    const { profileId, exerciseId } = input;
    await visibleExercise(this.deps, profileId, exerciseId);
    let value: number | null = null;
    if (input.loadIncrementKg !== null) {
      value = Math.round(input.loadIncrementKg * 100) / 100;
      if (!(value > 0) || value > MAX_INCREMENT_KG) {
        throw new ValidationError('exercise.increment_out_of_range', 'Increment is out of range');
      }
    }
    await this.deps.exercises.setProfileIncrement(
      profileId,
      exerciseId,
      value,
      this.deps.ids.next(),
      this.deps.clock.nowIso(),
    );
    return new GetExerciseHistory(this.deps).execute({ profileId, exerciseId });
  }
}
