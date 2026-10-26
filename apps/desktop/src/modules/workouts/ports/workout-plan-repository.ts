import type { MuscleGroup, Prescription } from '@evully/domain';

export interface PlanExerciseRecord {
  id: string;
  dayId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  exerciseActive: boolean;
  sortOrder: number;
  prescription: Prescription;
}

export interface WorkoutDayRecord {
  id: string;
  planId: string;
  name: string;
  weekday: number | null;
  sortOrder: number;
  exercises: PlanExerciseRecord[];
}

export interface WorkoutPlanRecord {
  id: string;
  profileId: string;
  name: string;
  status: 'active' | 'archived';
  days: WorkoutDayRecord[];
}

/** A whole plan to insert at once (new plan or template import). */
export interface NewPlanTree {
  id: string;
  profileId: string;
  name: string;
  days: {
    id: string;
    name: string;
    weekday: number | null;
    exercises: { id: string; exerciseId: string; prescription: Prescription }[];
  }[];
}

/** Every query is scoped by profile (README §6.1). */
export interface WorkoutPlanRepository {
  /** Plans with active days and exercises, in order; archived plans included. */
  list(profileId: string): Promise<WorkoutPlanRecord[]>;
  findPlan(profileId: string, id: string): Promise<WorkoutPlanRecord | null>;
  /** Plan id of a day or plan exercise, or null when not the profile's. */
  planOfDay(profileId: string, dayId: string): Promise<string | null>;
  planOfExercise(profileId: string, id: string): Promise<string | null>;
  insertTree(plan: NewPlanTree, now: string): Promise<void>;
  updatePlan(
    profileId: string,
    id: string,
    values: { name: string; status: 'active' | 'archived' },
    now: string,
  ): Promise<void>;
  insertDay(
    profileId: string,
    planId: string,
    day: { id: string; name: string; weekday: number | null },
    now: string,
  ): Promise<void>;
  updateDay(
    profileId: string,
    id: string,
    day: { name: string; weekday: number | null },
    now: string,
  ): Promise<void>;
  insertPlanExercise(
    profileId: string,
    dayId: string,
    item: { id: string; exerciseId: string; prescription: Prescription },
    now: string,
  ): Promise<void>;
  updatePlanExercise(
    profileId: string,
    id: string,
    prescription: Prescription,
    now: string,
  ): Promise<void>;
  /** Soft delete of a day (with its exercises) or of one plan exercise. */
  removeDay(profileId: string, id: string, now: string): Promise<void>;
  removePlanExercise(profileId: string, id: string, now: string): Promise<void>;
  /** Rewrites sort_order following `ids`. */
  reorderDays(profileId: string, ids: readonly string[], now: string): Promise<void>;
  reorderPlanExercises(profileId: string, ids: readonly string[], now: string): Promise<void>;
}
