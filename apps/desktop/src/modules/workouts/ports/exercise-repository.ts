import type { ExerciseDraft } from '@evully/domain';

export interface ExerciseRecord extends ExerciseDraft {
  id: string;
  /** Null for system exercises. */
  profileId: string | null;
  code: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseRepository {
  /** Active system exercises plus the profile's own, ordered by name. */
  list(profileId: string): Promise<ExerciseRecord[]>;
  /** Every exercise the profile can see, including deactivated ones (for history). */
  listAll(profileId: string): Promise<ExerciseRecord[]>;
  /** The profile's own active exercise (never a system one). */
  findOwn(profileId: string, id: string): Promise<ExerciseRecord | null>;
  insert(exercise: ExerciseRecord): Promise<void>;
  update(exercise: ExerciseRecord): Promise<void>;
  /** The profile's own load increment for an exercise (README §10.6), or null. */
  profileIncrement(profileId: string, exerciseId: string): Promise<number | null>;
  setProfileIncrement(
    profileId: string,
    exerciseId: string,
    loadIncrementKg: number | null,
    id: string,
    now: string,
  ): Promise<void>;
  /** Hides the exercise; its history stays (README §10.1, is_active). */
  deactivate(profileId: string, id: string, now: string): Promise<boolean>;
}
