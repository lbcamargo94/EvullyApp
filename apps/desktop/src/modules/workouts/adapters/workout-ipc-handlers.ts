import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  CreateExercise,
  DeactivateExercise,
  ListExercises,
  UpdateExercise,
} from '../application/manage-exercises';
import {
  AddPlanExercise,
  AddWorkoutDay,
  CreateWorkoutPlan,
  ImportPlanTemplate,
  ListWorkoutPlans,
  MovePlanExercise,
  MoveWorkoutDay,
  RemovePlanExercise,
  RemoveWorkoutDay,
  UpdatePlanExercise,
  UpdateWorkoutDay,
  UpdateWorkoutPlan,
  type PlanDeps,
} from '../application/manage-plans';

type WorkoutChannels =
  | 'exercises:list'
  | 'exercises:create'
  | 'exercises:update'
  | 'exercises:deactivate'
  | 'workout-plans:list'
  | 'workout-plans:create'
  | 'workout-plans:update'
  | 'workout-plans:import-template'
  | 'workout-days:add'
  | 'workout-days:update'
  | 'workout-days:remove'
  | 'workout-days:move'
  | 'plan-exercises:add'
  | 'plan-exercises:update'
  | 'plan-exercises:remove'
  | 'plan-exercises:move';

export function workoutIpcHandlers(deps: PlanDeps): Pick<IpcHandlers, WorkoutChannels> {
  return {
    'exercises:list': (input) => new ListExercises(deps).execute(input),
    'exercises:create': (input) => new CreateExercise(deps).execute(input),
    'exercises:update': (input) => new UpdateExercise(deps).execute(input),
    'exercises:deactivate': (input) => new DeactivateExercise(deps).execute(input),
    'workout-plans:list': (input) => new ListWorkoutPlans(deps).execute(input),
    'workout-plans:create': (input) => new CreateWorkoutPlan(deps).execute(input),
    'workout-plans:update': (input) => new UpdateWorkoutPlan(deps).execute(input),
    'workout-plans:import-template': (input) => new ImportPlanTemplate(deps).execute(input),
    'workout-days:add': (input) => new AddWorkoutDay(deps).execute(input),
    'workout-days:update': (input) => new UpdateWorkoutDay(deps).execute(input),
    'workout-days:remove': (input) => new RemoveWorkoutDay(deps).execute(input),
    'workout-days:move': (input) => new MoveWorkoutDay(deps).execute(input),
    'plan-exercises:add': (input) => new AddPlanExercise(deps).execute(input),
    'plan-exercises:update': (input) => new UpdatePlanExercise(deps).execute(input),
    'plan-exercises:remove': (input) => new RemovePlanExercise(deps).execute(input),
    'plan-exercises:move': (input) => new MovePlanExercise(deps).execute(input),
  };
}
