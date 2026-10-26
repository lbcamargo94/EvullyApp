import type { Prescription } from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, WorkoutPlanExercisesTable } from '../../../database/schema';
import type {
  NewPlanTree,
  PlanExerciseRecord,
  WorkoutDayRecord,
  WorkoutPlanRecord,
  WorkoutPlanRepository,
} from '../ports/workout-plan-repository';

type Db = Kysely<DatabaseSchema>;

const toPrescription = (r: Selectable<WorkoutPlanExercisesTable>): Prescription => ({
  sets: r.sets,
  targetType: r.target_type,
  minReps: r.min_reps,
  maxReps: r.max_reps,
  minSeconds: r.min_seconds,
  maxSeconds: r.max_seconds,
  perSide: r.per_side === 1,
  minRir: r.min_rir,
  maxRir: r.max_rir,
  minRestSeconds: r.min_rest_seconds,
  maxRestSeconds: r.max_rest_seconds,
  notes: r.notes,
});

const prescriptionColumns = (p: Prescription) => ({
  sets: p.sets,
  target_type: p.targetType,
  min_reps: p.minReps,
  max_reps: p.maxReps,
  min_seconds: p.minSeconds,
  max_seconds: p.maxSeconds,
  per_side: p.perSide ? 1 : 0,
  min_rir: p.minRir,
  max_rir: p.maxRir,
  min_rest_seconds: p.minRestSeconds,
  max_rest_seconds: p.maxRestSeconds,
  notes: p.notes,
});

export class KyselyWorkoutPlanRepository implements WorkoutPlanRepository {
  constructor(private readonly db: Db) {}

  async list(profileId: string): Promise<WorkoutPlanRecord[]> {
    const plans = await this.db
      .selectFrom('workout_plans')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .orderBy('name')
      .orderBy('id')
      .execute();
    if (!plans.length) return [];
    const days = await this.db
      .selectFrom('workout_days')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .orderBy('sort_order')
      .orderBy('id')
      .execute();
    const items = await this.db
      .selectFrom('workout_plan_exercises as pe')
      .innerJoin('exercises as e', 'e.id', 'pe.exercise_id')
      .selectAll('pe')
      .select(['e.name as exercise_name', 'e.muscle_group', 'e.is_active'])
      .where('pe.profile_id', '=', profileId)
      .where('pe.deleted_at', 'is', null)
      .orderBy('pe.sort_order')
      .orderBy('pe.id')
      .execute();

    const exercisesOf = (dayId: string): PlanExerciseRecord[] =>
      items
        .filter((i) => i.workout_day_id === dayId)
        .map((i) => ({
          id: i.id,
          dayId,
          exerciseId: i.exercise_id,
          exerciseName: i.exercise_name,
          muscleGroup: i.muscle_group,
          exerciseActive: i.is_active === 1,
          sortOrder: i.sort_order,
          prescription: toPrescription(i),
        }));
    const daysOf = (planId: string): WorkoutDayRecord[] =>
      days
        .filter((d) => d.plan_id === planId)
        .map((d) => ({
          id: d.id,
          planId,
          name: d.name,
          weekday: d.weekday,
          sortOrder: d.sort_order,
          exercises: exercisesOf(d.id),
        }));
    return plans.map((p) => ({
      id: p.id,
      profileId: p.profile_id,
      name: p.name,
      status: p.status,
      days: daysOf(p.id),
    }));
  }

  async findPlan(profileId: string, id: string): Promise<WorkoutPlanRecord | null> {
    return (await this.list(profileId)).find((p) => p.id === id) ?? null;
  }

  async planOfDay(profileId: string, dayId: string): Promise<string | null> {
    const row = await this.db
      .selectFrom('workout_days')
      .select('plan_id')
      .where('id', '=', dayId)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return row?.plan_id ?? null;
  }

  async planOfExercise(profileId: string, id: string): Promise<string | null> {
    const row = await this.db
      .selectFrom('workout_plan_exercises as pe')
      .innerJoin('workout_days as d', 'd.id', 'pe.workout_day_id')
      .select('d.plan_id')
      .where('pe.id', '=', id)
      .where('pe.profile_id', '=', profileId)
      .where('pe.deleted_at', 'is', null)
      .executeTakeFirst();
    return row?.plan_id ?? null;
  }

  async insertTree(plan: NewPlanTree, now: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('workout_plans')
        .values({
          id: plan.id,
          profile_id: plan.profileId,
          name: plan.name,
          status: 'active',
          created_at: now,
          updated_at: now,
        })
        .execute();
      for (const [dayIndex, day] of plan.days.entries()) {
        await trx
          .insertInto('workout_days')
          .values({
            id: day.id,
            profile_id: plan.profileId,
            plan_id: plan.id,
            name: day.name,
            weekday: day.weekday,
            sort_order: dayIndex + 1,
            created_at: now,
            updated_at: now,
          })
          .execute();
        for (const [index, item] of day.exercises.entries()) {
          await trx
            .insertInto('workout_plan_exercises')
            .values({
              id: item.id,
              profile_id: plan.profileId,
              workout_day_id: day.id,
              exercise_id: item.exerciseId,
              sort_order: index + 1,
              created_at: now,
              updated_at: now,
              ...prescriptionColumns(item.prescription),
            })
            .execute();
        }
      }
    });
  }

  async updatePlan(
    profileId: string,
    id: string,
    values: { name: string; status: 'active' | 'archived' },
    now: string,
  ): Promise<void> {
    await this.db
      .updateTable('workout_plans')
      .set({ name: values.name, status: values.status, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }

  private async nextDayOrder(planId: string): Promise<number> {
    const rows = await this.db
      .selectFrom('workout_days')
      .select('sort_order')
      .where('plan_id', '=', planId)
      .where('deleted_at', 'is', null)
      .execute();
    return Math.max(0, ...rows.map((r) => r.sort_order)) + 1;
  }

  private async nextExerciseOrder(dayId: string): Promise<number> {
    const rows = await this.db
      .selectFrom('workout_plan_exercises')
      .select('sort_order')
      .where('workout_day_id', '=', dayId)
      .where('deleted_at', 'is', null)
      .execute();
    return Math.max(0, ...rows.map((r) => r.sort_order)) + 1;
  }

  async insertDay(
    profileId: string,
    planId: string,
    day: { id: string; name: string; weekday: number | null },
    now: string,
  ): Promise<void> {
    await this.db
      .insertInto('workout_days')
      .values({
        id: day.id,
        profile_id: profileId,
        plan_id: planId,
        name: day.name,
        weekday: day.weekday,
        sort_order: await this.nextDayOrder(planId),
        created_at: now,
        updated_at: now,
      })
      .execute();
  }

  async updateDay(
    profileId: string,
    id: string,
    day: { name: string; weekday: number | null },
    now: string,
  ): Promise<void> {
    await this.db
      .updateTable('workout_days')
      .set({ name: day.name, weekday: day.weekday, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }

  async insertPlanExercise(
    profileId: string,
    dayId: string,
    item: { id: string; exerciseId: string; prescription: Prescription },
    now: string,
  ): Promise<void> {
    await this.db
      .insertInto('workout_plan_exercises')
      .values({
        id: item.id,
        profile_id: profileId,
        workout_day_id: dayId,
        exercise_id: item.exerciseId,
        sort_order: await this.nextExerciseOrder(dayId),
        created_at: now,
        updated_at: now,
        ...prescriptionColumns(item.prescription),
      })
      .execute();
  }

  async updatePlanExercise(
    profileId: string,
    id: string,
    prescription: Prescription,
    now: string,
  ): Promise<void> {
    await this.db
      .updateTable('workout_plan_exercises')
      .set({ ...prescriptionColumns(prescription), updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }

  async removeDay(profileId: string, id: string, now: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('workout_plan_exercises')
        .set({ deleted_at: now, updated_at: now })
        .where('workout_day_id', '=', id)
        .where('profile_id', '=', profileId)
        .where('deleted_at', 'is', null)
        .execute();
      await trx
        .updateTable('workout_days')
        .set({ deleted_at: now, updated_at: now })
        .where('id', '=', id)
        .where('profile_id', '=', profileId)
        .execute();
    });
  }

  async removePlanExercise(profileId: string, id: string, now: string): Promise<void> {
    await this.db
      .updateTable('workout_plan_exercises')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .execute();
  }

  async reorderDays(profileId: string, ids: readonly string[], now: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      for (const [index, id] of ids.entries()) {
        await trx
          .updateTable('workout_days')
          .set({ sort_order: index + 1, updated_at: now })
          .where('id', '=', id)
          .where('profile_id', '=', profileId)
          .execute();
      }
    });
  }

  async reorderPlanExercises(
    profileId: string,
    ids: readonly string[],
    now: string,
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      for (const [index, id] of ids.entries()) {
        await trx
          .updateTable('workout_plan_exercises')
          .set({ sort_order: index + 1, updated_at: now })
          .where('id', '=', id)
          .where('profile_id', '=', profileId)
          .execute();
      }
    });
  }
}
