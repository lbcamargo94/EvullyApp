import type { ExerciseDto, ExerciseInput, UpdateExerciseInput } from '@evully/contracts';
import { assertUniqueExerciseName, normalizeExerciseDraft, NotFoundError } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { ExerciseRecord, ExerciseRepository } from '../ports/exercise-repository';

export interface ExerciseDeps {
  profiles: ProfileRepository;
  exercises: ExerciseRepository;
  clock: Clock;
  ids: IdGenerator;
}

export const exerciseDto = (e: ExerciseRecord): ExerciseDto => ({
  id: e.id,
  code: e.code,
  isSystem: e.profileId === null,
  name: e.name,
  muscleGroup: e.muscleGroup,
  secondaryMuscles: e.secondaryMuscles,
  equipment: e.equipment,
  instructions: e.instructions,
  notes: e.notes,
  loadIncrementKg: e.loadIncrementKg,
});

const notFound = () => new NotFoundError('exercise.not_found', 'Exercise not found');

export class ListExercises {
  constructor(private readonly deps: ExerciseDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<ExerciseDto[]> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    return (await this.deps.exercises.list(profileId)).map(exerciseDto);
  }
}

export class CreateExercise {
  constructor(private readonly deps: ExerciseDeps) {}

  async execute({ profileId, ...input }: ExerciseInput): Promise<ExerciseDto> {
    const { profiles, exercises, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const draft = normalizeExerciseDraft(input);
    assertUniqueExerciseName(
      draft.name,
      (await exercises.list(profileId)).map((e) => e.name),
    );
    const now = clock.nowIso();
    const record: ExerciseRecord = {
      ...draft,
      id: ids.next(),
      profileId,
      code: null,
      createdAt: now,
      updatedAt: now,
    };
    await exercises.insert(record);
    return exerciseDto(record);
  }
}

/** Only the profile's own exercises can be edited; system ones are read-only. */
export class UpdateExercise {
  constructor(private readonly deps: ExerciseDeps) {}

  async execute({ profileId, id, ...input }: UpdateExerciseInput): Promise<ExerciseDto> {
    const { exercises, clock } = this.deps;
    const current = await exercises.findOwn(profileId, id);
    if (!current) throw notFound();
    const draft = normalizeExerciseDraft(input);
    assertUniqueExerciseName(
      draft.name,
      (await exercises.list(profileId)).filter((e) => e.id !== id).map((e) => e.name),
    );
    const record = { ...current, ...draft, updatedAt: clock.nowIso() };
    await exercises.update(record);
    return exerciseDto(record);
  }
}

export class DeactivateExercise {
  constructor(private readonly deps: ExerciseDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    if (!(await this.deps.exercises.deactivate(profileId, id, this.deps.clock.nowIso()))) {
      throw notFound();
    }
    return null;
  }
}
