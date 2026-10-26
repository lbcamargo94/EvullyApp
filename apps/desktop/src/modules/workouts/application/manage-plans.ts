import type { PlanTemplateCode, PrescriptionDto, WorkoutPlanDto } from '@evully/contracts';
import {
  availablePlanName,
  moveInOrder,
  normalizePlanName,
  normalizePrescription,
  normalizeWorkoutDay,
  NotFoundError,
  PLAN_TEMPLATES,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { ExerciseRepository } from '../ports/exercise-repository';
import type { WorkoutPlanRecord, WorkoutPlanRepository } from '../ports/workout-plan-repository';

export interface PlanDeps {
  profiles: ProfileRepository;
  exercises: ExerciseRepository;
  plans: WorkoutPlanRepository;
  clock: Clock;
  ids: IdGenerator;
}

const notFound = () => new NotFoundError('workout_plan.not_found', 'Plan not found');

const toDto = (p: WorkoutPlanRecord): WorkoutPlanDto => ({
  id: p.id,
  name: p.name,
  status: p.status,
  days: p.days.map((d) => ({
    id: d.id,
    name: d.name,
    weekday: d.weekday,
    exercises: d.exercises.map((e) => ({
      id: e.id,
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      muscleGroup: e.muscleGroup,
      exerciseActive: e.exerciseActive,
      prescription: e.prescription,
    })),
  })),
});

async function planDto(deps: PlanDeps, profileId: string, planId: string): Promise<WorkoutPlanDto> {
  const plan = await deps.plans.findPlan(profileId, planId);
  if (!plan) throw notFound();
  return toDto(plan);
}

async function otherPlanNames(deps: PlanDeps, profileId: string, exceptId?: string) {
  return (await deps.plans.list(profileId)).filter((p) => p.id !== exceptId).map((p) => p.name);
}

export class ListWorkoutPlans {
  constructor(private readonly deps: PlanDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<WorkoutPlanDto[]> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    return (await this.deps.plans.list(profileId)).map(toDto);
  }
}

export class CreateWorkoutPlan {
  constructor(private readonly deps: PlanDeps) {}

  async execute({ profileId, name }: { profileId: string; name: string }) {
    const { profiles, plans, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const id = ids.next();
    await plans.insertTree(
      {
        id,
        profileId,
        name: normalizePlanName(name, await otherPlanNames(this.deps, profileId)),
        days: [],
      },
      clock.nowIso(),
    );
    return planDto(this.deps, profileId, id);
  }
}

/** Rename, archive or restore. */
export class UpdateWorkoutPlan {
  constructor(private readonly deps: PlanDeps) {}

  async execute(input: {
    profileId: string;
    id: string;
    name: string;
    status: 'active' | 'archived';
  }) {
    const { profileId, id } = input;
    if (!(await this.deps.plans.findPlan(profileId, id))) throw notFound();
    const name = normalizePlanName(input.name, await otherPlanNames(this.deps, profileId, id));
    await this.deps.plans.updatePlan(
      profileId,
      id,
      { name, status: input.status },
      this.deps.clock.nowIso(),
    );
    return planDto(this.deps, profileId, id);
  }
}

/** Copies a template plan using the system catalog (README §10.7, §10.8). */
export class ImportPlanTemplate {
  constructor(private readonly deps: PlanDeps) {}

  async execute({ profileId, template }: { profileId: string; template: PlanTemplateCode }) {
    const { profiles, exercises, plans, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const source = PLAN_TEMPLATES.find((t) => t.code === template);
    if (!source) throw notFound();
    const byCode = new Map(
      (await exercises.list(profileId)).flatMap((e) => (e.code ? [[e.code, e.id] as const] : [])),
    );
    const id = ids.next();
    await plans.insertTree(
      {
        id,
        profileId,
        name: availablePlanName(source.name, await otherPlanNames(this.deps, profileId)),
        days: source.days.map((day) => ({
          id: ids.next(),
          name: day.name,
          weekday: day.weekday,
          exercises: day.exercises.flatMap(({ exerciseCode, prescription }) => {
            const exerciseId = byCode.get(exerciseCode);
            return exerciseId
              ? [{ id: ids.next(), exerciseId, prescription: normalizePrescription(prescription) }]
              : [];
          }),
        })),
      },
      clock.nowIso(),
    );
    return planDto(this.deps, profileId, id);
  }
}

export class AddWorkoutDay {
  constructor(private readonly deps: PlanDeps) {}

  async execute(input: {
    profileId: string;
    planId: string;
    name: string;
    weekday: number | null;
  }) {
    const { profileId, planId } = input;
    if (!(await this.deps.plans.findPlan(profileId, planId))) throw notFound();
    await this.deps.plans.insertDay(
      profileId,
      planId,
      { id: this.deps.ids.next(), ...normalizeWorkoutDay(input) },
      this.deps.clock.nowIso(),
    );
    return planDto(this.deps, profileId, planId);
  }
}

async function dayPlan(deps: PlanDeps, profileId: string, dayId: string) {
  const planId = await deps.plans.planOfDay(profileId, dayId);
  if (!planId) throw new NotFoundError('workout_day.not_found', 'Day not found');
  return planId;
}

async function itemPlan(deps: PlanDeps, profileId: string, id: string) {
  const planId = await deps.plans.planOfExercise(profileId, id);
  if (!planId) throw new NotFoundError('plan_exercise.not_found', 'Plan exercise not found');
  return planId;
}

export class UpdateWorkoutDay {
  constructor(private readonly deps: PlanDeps) {}

  async execute(input: { profileId: string; id: string; name: string; weekday: number | null }) {
    const planId = await dayPlan(this.deps, input.profileId, input.id);
    await this.deps.plans.updateDay(
      input.profileId,
      input.id,
      normalizeWorkoutDay(input),
      this.deps.clock.nowIso(),
    );
    return planDto(this.deps, input.profileId, planId);
  }
}

export class RemoveWorkoutDay {
  constructor(private readonly deps: PlanDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }) {
    const planId = await dayPlan(this.deps, profileId, id);
    await this.deps.plans.removeDay(profileId, id, this.deps.clock.nowIso());
    return planDto(this.deps, profileId, planId);
  }
}

export class MoveWorkoutDay {
  constructor(private readonly deps: PlanDeps) {}

  async execute({
    profileId,
    id,
    direction,
  }: {
    profileId: string;
    id: string;
    direction: 'up' | 'down';
  }) {
    const planId = await dayPlan(this.deps, profileId, id);
    const plan = await planDto(this.deps, profileId, planId);
    const order = moveInOrder(
      plan.days.map((d) => d.id),
      id,
      direction,
    );
    await this.deps.plans.reorderDays(profileId, order, this.deps.clock.nowIso());
    return planDto(this.deps, profileId, planId);
  }
}

export class AddPlanExercise {
  constructor(private readonly deps: PlanDeps) {}

  async execute(input: {
    profileId: string;
    dayId: string;
    exerciseId: string;
    prescription: PrescriptionDto;
  }) {
    const { profileId, dayId, exerciseId } = input;
    const planId = await dayPlan(this.deps, profileId, dayId);
    const exercise = (await this.deps.exercises.list(profileId)).find((e) => e.id === exerciseId);
    if (!exercise) throw new NotFoundError('exercise.not_found', 'Exercise not found');
    await this.deps.plans.insertPlanExercise(
      profileId,
      dayId,
      {
        id: this.deps.ids.next(),
        exerciseId,
        prescription: normalizePrescription(input.prescription),
      },
      this.deps.clock.nowIso(),
    );
    return planDto(this.deps, profileId, planId);
  }
}

export class UpdatePlanExercise {
  constructor(private readonly deps: PlanDeps) {}

  async execute(input: { profileId: string; id: string; prescription: PrescriptionDto }) {
    const planId = await itemPlan(this.deps, input.profileId, input.id);
    await this.deps.plans.updatePlanExercise(
      input.profileId,
      input.id,
      normalizePrescription(input.prescription),
      this.deps.clock.nowIso(),
    );
    return planDto(this.deps, input.profileId, planId);
  }
}

export class RemovePlanExercise {
  constructor(private readonly deps: PlanDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }) {
    const planId = await itemPlan(this.deps, profileId, id);
    await this.deps.plans.removePlanExercise(profileId, id, this.deps.clock.nowIso());
    return planDto(this.deps, profileId, planId);
  }
}

export class MovePlanExercise {
  constructor(private readonly deps: PlanDeps) {}

  async execute({
    profileId,
    id,
    direction,
  }: {
    profileId: string;
    id: string;
    direction: 'up' | 'down';
  }) {
    const planId = await itemPlan(this.deps, profileId, id);
    const plan = await planDto(this.deps, profileId, planId);
    const day = plan.days.find((d) => d.exercises.some((e) => e.id === id));
    const order = moveInOrder(day?.exercises.map((e) => e.id) ?? [], id, direction);
    await this.deps.plans.reorderPlanExercises(profileId, order, this.deps.clock.nowIso());
    return planDto(this.deps, profileId, planId);
  }
}
