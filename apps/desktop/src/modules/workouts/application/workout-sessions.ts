import type { SetValuesDto, WorkoutSessionDto } from '@evully/contracts';
import {
  ConflictError,
  normalizeSetValues,
  NotFoundError,
  summarizePerformance,
  ValidationError,
  type Prescription,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ExerciseRecord } from '../ports/exercise-repository';
import type {
  NewPerformance,
  SessionRecord,
  SessionRepository,
  SetRecord,
} from '../ports/session-repository';
import type { PlanDeps } from './manage-plans';

export interface SessionDeps extends PlanDeps {
  sessions: SessionRepository;
}

const notFound = () => new NotFoundError('workout_session.not_found', 'Session not found');

type PerformanceDto = WorkoutSessionDto['performances'][number];

interface SessionContext {
  exercises: Map<string, ExerciseRecord>;
  prescriptions: Map<string, Prescription>;
}

/** Summary of the previous finished session with the exercise, or null. */
async function lastSummary(deps: SessionDeps, session: SessionRecord, exerciseId: string) {
  const previous = await deps.sessions.lastPerformance(session.profileId, exerciseId, session.id);
  const summary = previous && summarizePerformance(previous.sets);
  return previous && summary ? { date: previous.startedAt, ...summary } : null;
}

/** One exercise of the session with its prescription and previous session. */
async function performanceDto(
  deps: SessionDeps,
  session: SessionRecord,
  p: SessionRecord['performances'][number],
  ctx: SessionContext,
): Promise<PerformanceDto> {
  const exercise = ctx.exercises.get(p.exerciseId);
  const prescription = (p.planExerciseId && ctx.prescriptions.get(p.planExerciseId)) || null;
  const last = await lastSummary(deps, session, p.exerciseId);
  return {
    id: p.id,
    exerciseId: p.exerciseId,
    exerciseName: exercise?.name ?? '',
    muscleGroup: exercise?.muscleGroup ?? 'cardio_other',
    prescription,
    targetType: prescription?.targetType ?? last?.unit ?? 'reps',
    last,
    sets: p.sets,
  };
}

/** Builds the screen model: names, prescriptions and the previous session of each exercise. */
async function sessionDto(deps: SessionDeps, session: SessionRecord): Promise<WorkoutSessionDto> {
  const { profileId } = session;
  const plans = await deps.plans.list(profileId);
  const days = plans.flatMap((plan) => plan.days.map((day) => ({ plan, day })));
  const current = days.find((x) => x.day.id === session.workoutDayId);
  const ctx: SessionContext = {
    exercises: new Map((await deps.exercises.listAll(profileId)).map((e) => [e.id, e])),
    prescriptions: new Map(
      days.flatMap((x) => x.day.exercises).map((e) => [e.id, e.prescription] as const),
    ),
  };
  const performances: PerformanceDto[] = [];
  for (const p of session.performances) {
    performances.push(await performanceDto(deps, session, p, ctx));
  }
  return {
    id: session.id,
    planName: current?.plan.name ?? null,
    dayName: current?.day.name ?? null,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    notes: session.notes,
    performances,
  };
}

async function reload(deps: SessionDeps, profileId: string, id: string) {
  const session = await deps.sessions.findById(profileId, id);
  if (!session) throw notFound();
  return sessionDto(deps, session);
}

/** Planned sets, each prefilled with the load of the same set last time (README §10.4). */
async function newPerformance(
  deps: SessionDeps,
  profileId: string,
  exerciseId: string,
  planExerciseId: string | null,
  setCount: number,
): Promise<NewPerformance> {
  const previous = await deps.sessions.lastPerformance(profileId, exerciseId, '');
  const loadOf = (n: number) =>
    previous?.sets.find((s: SetRecord) => s.setNumber === n)?.weightKg ??
    previous?.sets.at(-1)?.weightKg ??
    null;
  return {
    id: deps.ids.next(),
    exerciseId,
    planExerciseId,
    sets: Array.from({ length: setCount }, (_, i) => ({
      id: deps.ids.next(),
      weightKg: loadOf(i + 1),
    })),
  };
}

const DEFAULT_SETS = 3;

export class GetOpenSession {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<WorkoutSessionDto | null> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const open = await this.deps.sessions.findOpen(profileId);
    return open && sessionDto(this.deps, open);
  }
}

/** Starts from a plan day (its exercises and sets) or empty; one open session at a time. */
export class StartSession {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId, workoutDayId }: { profileId: string; workoutDayId: string | null }) {
    const { profiles, plans, sessions, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    if (await sessions.findOpen(profileId)) {
      throw new ConflictError('workout_session.open_exists', 'A session is already open');
    }
    const performances: NewPerformance[] = [];
    if (workoutDayId) {
      const day = (await plans.list(profileId))
        .flatMap((p) => p.days)
        .find((d) => d.id === workoutDayId);
      if (!day) throw new NotFoundError('workout_day.not_found', 'Day not found');
      for (const item of day.exercises.filter((e) => e.exerciseActive)) {
        performances.push(
          await newPerformance(
            this.deps,
            profileId,
            item.exerciseId,
            item.id,
            item.prescription.sets,
          ),
        );
      }
    }
    const id = ids.next();
    await sessions.insertSession(
      { id, profileId, workoutDayId, startedAt: clock.nowIso() },
      performances,
    );
    return reload(this.deps, profileId, id);
  }
}

async function openSessionOf(deps: SessionDeps, profileId: string, sessionId: string | null) {
  if (!sessionId) throw notFound();
  const session = await deps.sessions.findById(profileId, sessionId);
  if (!session) throw notFound();
  if (session.finishedAt)
    throw new ConflictError('workout_session.finished', 'Session is finished');
  return session;
}

export class UpdateSet {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId, id, ...values }: { profileId: string; id: string } & SetValuesDto) {
    const session = await openSessionOf(
      this.deps,
      profileId,
      await this.deps.sessions.sessionOfSet(profileId, id),
    );
    await this.deps.sessions.updateSet(
      profileId,
      id,
      normalizeSetValues(values),
      this.deps.clock.nowIso(),
    );
    return reload(this.deps, profileId, session.id);
  }
}

export class AddSet {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId, performanceId }: { profileId: string; performanceId: string }) {
    const { sessions, ids, clock } = this.deps;
    const session = await openSessionOf(
      this.deps,
      profileId,
      await sessions.sessionOfPerformance(profileId, performanceId),
    );
    const performance = session.performances.find((p) => p.id === performanceId);
    await sessions.addSet(
      profileId,
      performanceId,
      { id: ids.next(), weightKg: performance?.sets.at(-1)?.weightKg ?? null },
      clock.nowIso(),
    );
    return reload(this.deps, profileId, session.id);
  }
}

export class RemoveSet {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }) {
    const session = await openSessionOf(
      this.deps,
      profileId,
      await this.deps.sessions.sessionOfSet(profileId, id),
    );
    await this.deps.sessions.removeSet(profileId, id, this.deps.clock.nowIso());
    return reload(this.deps, profileId, session.id);
  }
}

async function ownExercise(deps: SessionDeps, profileId: string, exerciseId: string) {
  const exercise = (await deps.exercises.list(profileId)).find((e) => e.id === exerciseId);
  if (!exercise) throw new NotFoundError('exercise.not_found', 'Exercise not found');
  return exercise;
}

export class AddPerformance {
  constructor(private readonly deps: SessionDeps) {}

  async execute({
    profileId,
    sessionId,
    exerciseId,
  }: {
    profileId: string;
    sessionId: string;
    exerciseId: string;
  }) {
    const session = await openSessionOf(this.deps, profileId, sessionId);
    await ownExercise(this.deps, profileId, exerciseId);
    await this.deps.sessions.addPerformance(
      profileId,
      session.id,
      await newPerformance(this.deps, profileId, exerciseId, null, DEFAULT_SETS),
      this.deps.clock.nowIso(),
    );
    return reload(this.deps, profileId, session.id);
  }
}

/** Swaps the exercise of a performance (e.g. a machine is busy); the planned sets are kept. */
export class ReplacePerformance {
  constructor(private readonly deps: SessionDeps) {}

  async execute({
    profileId,
    id,
    exerciseId,
  }: {
    profileId: string;
    id: string;
    exerciseId: string;
  }) {
    const { sessions, clock } = this.deps;
    const session = await openSessionOf(
      this.deps,
      profileId,
      await sessions.sessionOfPerformance(profileId, id),
    );
    await ownExercise(this.deps, profileId, exerciseId);
    const old = session.performances.find((p) => p.id === id);
    const now = clock.nowIso();
    await sessions.removePerformance(profileId, id, now);
    await sessions.addPerformance(
      profileId,
      session.id,
      await newPerformance(
        this.deps,
        profileId,
        exerciseId,
        old?.planExerciseId ?? null,
        old?.sets.length || DEFAULT_SETS,
      ),
      now,
    );
    return reload(this.deps, profileId, session.id);
  }
}

export class RemovePerformance {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }) {
    const session = await openSessionOf(
      this.deps,
      profileId,
      await this.deps.sessions.sessionOfPerformance(profileId, id),
    );
    await this.deps.sessions.removePerformance(profileId, id, this.deps.clock.nowIso());
    return reload(this.deps, profileId, session.id);
  }
}

/** Ends the session; it needs at least one completed set. */
export class FinishSession {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId, id, notes }: { profileId: string; id: string; notes: string | null }) {
    const session = await openSessionOf(this.deps, profileId, id);
    if (!session.performances.some((p) => p.sets.some((s) => s.completed))) {
      throw new ValidationError('workout_session.nothing_done', 'No set was completed');
    }
    const clean = notes?.trim() || null;
    if (clean && [...clean].length > 500)
      throw new ValidationError('workout_session.notes_too_long', 'Too long');
    await this.deps.sessions.finish(profileId, session.id, clean, this.deps.clock.nowIso());
    return null;
  }
}

/** Throws the open session away (soft delete), after the user confirms on screen. */
export class DiscardSession {
  constructor(private readonly deps: SessionDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }) {
    const session = await openSessionOf(this.deps, profileId, id);
    await this.deps.sessions.discard(profileId, session.id, this.deps.clock.nowIso());
    return null;
  }
}
