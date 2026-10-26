import type { MuscleGroup } from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, ExercisesTable } from '../../../database/schema';
import type { ExerciseRecord, ExerciseRepository } from '../ports/exercise-repository';

const toRecord = (r: Selectable<ExercisesTable>): ExerciseRecord => ({
  id: r.id,
  profileId: r.profile_id,
  code: r.code,
  name: r.name,
  muscleGroup: r.muscle_group,
  secondaryMuscles: JSON.parse(r.secondary_muscles) as MuscleGroup[],
  equipment: r.equipment,
  instructions: r.instructions,
  notes: r.notes,
  loadIncrementKg: r.load_increment_kg,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toRow = (e: ExerciseRecord) => ({
  name: e.name,
  muscle_group: e.muscleGroup,
  secondary_muscles: JSON.stringify(e.secondaryMuscles),
  equipment: e.equipment,
  instructions: e.instructions,
  notes: e.notes,
  load_increment_kg: e.loadIncrementKg,
  updated_at: e.updatedAt,
});

export class KyselyExerciseRepository implements ExerciseRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async list(profileId: string): Promise<ExerciseRecord[]> {
    const rows = await this.db
      .selectFrom('exercises')
      .selectAll()
      .where('is_active', '=', 1)
      .where((eb) => eb.or([eb('profile_id', 'is', null), eb('profile_id', '=', profileId)]))
      .orderBy('name')
      .orderBy('id')
      .execute();
    return rows.map(toRecord);
  }

  async listAll(profileId: string): Promise<ExerciseRecord[]> {
    const rows = await this.db
      .selectFrom('exercises')
      .selectAll()
      .where((eb) => eb.or([eb('profile_id', 'is', null), eb('profile_id', '=', profileId)]))
      .execute();
    return rows.map(toRecord);
  }

  async findOwn(profileId: string, id: string): Promise<ExerciseRecord | null> {
    const row = await this.db
      .selectFrom('exercises')
      .selectAll()
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('is_active', '=', 1)
      .executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async insert(e: ExerciseRecord): Promise<void> {
    await this.db
      .insertInto('exercises')
      .values({
        id: e.id,
        profile_id: e.profileId,
        code: null,
        is_active: 1,
        created_at: e.createdAt,
        ...toRow(e),
      })
      .execute();
  }

  async update(e: ExerciseRecord): Promise<void> {
    if (e.profileId === null) return; // system exercises are read-only
    await this.db
      .updateTable('exercises')
      .set(toRow(e))
      .where('id', '=', e.id)
      .where('profile_id', '=', e.profileId)
      .execute();
  }

  async profileIncrement(profileId: string, exerciseId: string): Promise<number | null> {
    const row = await this.db
      .selectFrom('profile_exercise_settings')
      .select('load_increment_kg')
      .where('profile_id', '=', profileId)
      .where('exercise_id', '=', exerciseId)
      .executeTakeFirst();
    return row?.load_increment_kg ?? null;
  }

  async setProfileIncrement(
    profileId: string,
    exerciseId: string,
    loadIncrementKg: number | null,
    id: string,
    now: string,
  ): Promise<void> {
    await this.db
      .insertInto('profile_exercise_settings')
      .values({
        id,
        profile_id: profileId,
        exercise_id: exerciseId,
        load_increment_kg: loadIncrementKg,
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc
          .columns(['profile_id', 'exercise_id'])
          .doUpdateSet({ load_increment_kg: loadIncrementKg, updated_at: now }),
      )
      .execute();
  }

  async deactivate(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('exercises')
      .set({ is_active: 0, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('is_active', '=', 1)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }
}
