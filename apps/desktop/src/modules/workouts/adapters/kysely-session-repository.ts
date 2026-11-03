import type { SetValues } from '@evully/domain';
import type { Kysely, Selectable, Transaction } from 'kysely';
import type { DatabaseSchema, ExerciseSetsTable } from '../../../database/schema';
import type {
  NewPerformance,
  SessionRecord,
  SessionRepository,
  SetRecord,
} from '../ports/session-repository';

type Db = Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;

const toSet = (r: Selectable<ExerciseSetsTable>): SetRecord => ({
  id: r.id,
  setNumber: r.set_number,
  weightKg: r.weight_kg,
  repetitions: r.repetitions,
  durationSeconds: r.duration_seconds,
  rir: r.rir,
  completed: r.completed === 1,
  notes: r.notes,
});

async function insertPerformance(
  db: Db,
  profileId: string,
  sessionId: string,
  p: NewPerformance,
  sortOrder: number,
  now: string,
) {
  await db
    .insertInto('exercise_performances')
    .values({
      id: p.id,
      profile_id: profileId,
      session_id: sessionId,
      exercise_id: p.exerciseId,
      plan_exercise_id: p.planExerciseId,
      sort_order: sortOrder,
      created_at: now,
      updated_at: now,
    })
    .execute();
  for (const [index, set] of p.sets.entries()) {
    await insertSet(db, profileId, p.id, set, index + 1, now);
  }
}

async function insertSet(
  db: Db,
  profileId: string,
  performanceId: string,
  set: { id: string; weightKg: number | null },
  setNumber: number,
  now: string,
) {
  await db
    .insertInto('exercise_sets')
    .values({
      id: set.id,
      profile_id: profileId,
      performance_id: performanceId,
      set_number: setNumber,
      weight_kg: set.weightKg,
      completed: 0,
      created_at: now,
      updated_at: now,
    })
    .execute();
}

function groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(keyOf(item));
    if (group) group.push(item);
    else groups.set(keyOf(item), [item]);
  }
  return groups;
}

export class KyselySessionRepository implements SessionRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private async load(
    profileId: string,
    where: { id?: string; open?: boolean },
  ): Promise<SessionRecord | null> {
    let query = this.db
      .selectFrom('workout_sessions')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
    if (where.id) query = query.where('id', '=', where.id);
    if (where.open) query = query.where('finished_at', 'is', null);
    const session = await query
      .orderBy('started_at', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst();
    if (!session) return null;
    const performances = await this.db
      .selectFrom('exercise_performances')
      .selectAll()
      .where('session_id', '=', session.id)
      .where('deleted_at', 'is', null)
      .orderBy('sort_order')
      .orderBy('id')
      .execute();
    const sets = performances.length
      ? await this.db
          .selectFrom('exercise_sets')
          .selectAll()
          .where(
            'performance_id',
            'in',
            performances.map((p) => p.id),
          )
          .where('deleted_at', 'is', null)
          .orderBy('set_number')
          .execute()
      : [];
    return {
      id: session.id,
      profileId: session.profile_id,
      workoutDayId: session.workout_day_id,
      startedAt: session.started_at,
      finishedAt: session.finished_at,
      notes: session.notes,
      performances: performances.map((p) => ({
        id: p.id,
        exerciseId: p.exercise_id,
        planExerciseId: p.plan_exercise_id,
        sortOrder: p.sort_order,
        sets: sets.filter((s) => s.performance_id === p.id).map(toSet),
      })),
    };
  }

  findOpen(profileId: string) {
    return this.load(profileId, { open: true });
  }

  findById(profileId: string, id: string) {
    return this.load(profileId, { id });
  }

  async lastPerformance(profileId: string, exerciseId: string, beforeSessionId: string) {
    const row = await this.db
      .selectFrom('exercise_performances as p')
      .innerJoin('workout_sessions as s', 's.id', 'p.session_id')
      .select(['p.id', 's.started_at'])
      .where('p.profile_id', '=', profileId)
      .where('p.exercise_id', '=', exerciseId)
      .where('p.deleted_at', 'is', null)
      .where('s.deleted_at', 'is', null)
      .where('s.finished_at', 'is not', null)
      .where('s.id', '!=', beforeSessionId)
      .orderBy('s.started_at', 'desc')
      // UUID v7 ids break ties within the same instant.
      .orderBy('s.id', 'desc')
      .executeTakeFirst();
    if (!row) return null;
    const sets = await this.db
      .selectFrom('exercise_sets')
      .selectAll()
      .where('performance_id', '=', row.id)
      .where('deleted_at', 'is', null)
      .orderBy('set_number')
      .execute();
    return { startedAt: row.started_at, sets: sets.map(toSet) };
  }

  async history(profileId: string, exerciseId: string) {
    const rows = await this.db
      .selectFrom('exercise_performances as p')
      .innerJoin('workout_sessions as s', 's.id', 'p.session_id')
      .select(['p.id as performance_id', 's.id as session_id', 's.started_at'])
      .where('p.profile_id', '=', profileId)
      .where('p.exercise_id', '=', exerciseId)
      .where('p.deleted_at', 'is', null)
      .where('s.deleted_at', 'is', null)
      .where('s.finished_at', 'is not', null)
      .orderBy('s.started_at', 'desc')
      // UUID v7 ids break ties within the same instant.
      .orderBy('s.id', 'desc')
      .execute();
    if (!rows.length) return [];
    const sets = await this.db
      .selectFrom('exercise_sets')
      .selectAll()
      .where(
        'performance_id',
        'in',
        rows.map((r) => r.performance_id),
      )
      .where('deleted_at', 'is', null)
      .orderBy('set_number')
      .execute();
    // A session may hold the same exercise twice: merge its performances.
    const bySession = new Map<
      string,
      { sessionId: string; startedAt: string; sets: SetRecord[] }
    >();
    for (const r of rows) {
      const entry = bySession.get(r.session_id) ?? {
        sessionId: r.session_id,
        startedAt: r.started_at,
        sets: [],
      };
      entry.sets.push(...sets.filter((s) => s.performance_id === r.performance_id).map(toSet));
      bySession.set(r.session_id, entry);
    }
    return [...bySession.values()];
  }

  async finishedSessions(profileId: string) {
    const sessions = await this.db
      .selectFrom('workout_sessions')
      .select(['id', 'started_at'])
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .where('finished_at', 'is not', null)
      .orderBy('started_at')
      .orderBy('id')
      .execute();
    const performances = await this.db
      .selectFrom('exercise_performances')
      .select(['id', 'session_id', 'exercise_id'])
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .orderBy('sort_order')
      .orderBy('id')
      .execute();
    const sets = await this.db
      .selectFrom('exercise_sets')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .orderBy('set_number')
      .execute();
    const setsOf = groupBy(sets, (s) => s.performance_id);
    const performancesOf = groupBy(performances, (p) => p.session_id);
    return sessions.map((s) => ({
      id: s.id,
      startedAt: s.started_at,
      // A session may hold the same exercise twice: merge its performances.
      exercises: [...groupBy(performancesOf.get(s.id) ?? [], (p) => p.exercise_id)].map(
        ([exerciseId, repeats]) => ({
          exerciseId,
          sets: repeats.flatMap((p) => setsOf.get(p.id) ?? []).map(toSet),
        }),
      ),
    }));
  }

  async insertSession(
    session: { id: string; profileId: string; workoutDayId: string | null; startedAt: string },
    performances: NewPerformance[],
  ): Promise<void> {
    const now = session.startedAt;
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('workout_sessions')
        .values({
          id: session.id,
          profile_id: session.profileId,
          workout_day_id: session.workoutDayId,
          started_at: session.startedAt,
          created_at: now,
          updated_at: now,
        })
        .execute();
      for (const [index, p] of performances.entries()) {
        await insertPerformance(trx, session.profileId, session.id, p, index + 1, now);
      }
    });
  }

  async addPerformance(profileId: string, sessionId: string, p: NewPerformance, now: string) {
    const rows = await this.db
      .selectFrom('exercise_performances')
      .select('sort_order')
      .where('session_id', '=', sessionId)
      .where('deleted_at', 'is', null)
      .execute();
    const order = Math.max(0, ...rows.map((r) => r.sort_order)) + 1;
    await this.db
      .transaction()
      .execute((trx) => insertPerformance(trx, profileId, sessionId, p, order, now));
  }

  async removePerformance(profileId: string, id: string, now: string) {
    await this.db
      .updateTable('exercise_performances')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }

  async addSet(
    profileId: string,
    performanceId: string,
    set: { id: string; weightKg: number | null },
    now: string,
  ) {
    const rows = await this.db
      .selectFrom('exercise_sets')
      .select('set_number')
      .where('performance_id', '=', performanceId)
      .where('deleted_at', 'is', null)
      .execute();
    await insertSet(
      this.db,
      profileId,
      performanceId,
      set,
      Math.max(0, ...rows.map((r) => r.set_number)) + 1,
      now,
    );
  }

  async updateSet(profileId: string, id: string, v: SetValues, now: string) {
    await this.db
      .updateTable('exercise_sets')
      .set({
        weight_kg: v.weightKg,
        repetitions: v.repetitions,
        duration_seconds: v.durationSeconds,
        rir: v.rir,
        completed: v.completed ? 1 : 0,
        notes: v.notes,
        updated_at: now,
      })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }

  async removeSet(profileId: string, id: string, now: string) {
    await this.db
      .updateTable('exercise_sets')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }

  async sessionOfPerformance(profileId: string, id: string) {
    const row = await this.db
      .selectFrom('exercise_performances')
      .select('session_id')
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return row?.session_id ?? null;
  }

  async sessionOfSet(profileId: string, id: string) {
    const row = await this.db
      .selectFrom('exercise_sets as s')
      .innerJoin('exercise_performances as p', 'p.id', 's.performance_id')
      .select('p.session_id')
      .where('s.id', '=', id)
      .where('s.profile_id', '=', profileId)
      .where('s.deleted_at', 'is', null)
      .executeTakeFirst();
    return row?.session_id ?? null;
  }

  async finish(profileId: string, id: string, notes: string | null, now: string) {
    await this.db
      .updateTable('workout_sessions')
      .set({ finished_at: now, notes, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }

  async discard(profileId: string, id: string, now: string) {
    await this.db
      .updateTable('workout_sessions')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }
}
