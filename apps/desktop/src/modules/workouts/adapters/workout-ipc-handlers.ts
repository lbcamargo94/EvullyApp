import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  CreateExercise,
  DeactivateExercise,
  ListExercises,
  UpdateExercise,
} from '../application/manage-exercises';
import { GetExerciseHistory, SetExerciseIncrement } from '../application/exercise-history';
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
} from '../application/manage-plans';
import {
  AddPerformance,
  AddSet,
  DiscardSession,
  FinishSession,
  GetOpenSession,
  RemovePerformance,
  RemoveSet,
  ReplacePerformance,
  StartSession,
  UpdateSet,
  type SessionDeps,
} from '../application/workout-sessions';

type WorkoutChannels =
  | 'exercises:list'
  | 'exercises:create'
  | 'exercises:update'
  | 'exercises:deactivate'
  | 'exercises:history'
  | 'exercises:set-increment'
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
  | 'plan-exercises:move'
  | 'workout-sessions:open'
  | 'workout-sessions:start'
  | 'workout-sessions:finish'
  | 'workout-sessions:discard'
  | 'workout-sets:update'
  | 'workout-sets:add'
  | 'workout-sets:remove'
  | 'workout-performances:add'
  | 'workout-performances:replace'
  | 'workout-performances:remove';

export function workoutIpcHandlers(deps: SessionDeps): Pick<IpcHandlers, WorkoutChannels> {
  return {
    'exercises:list': (input) => new ListExercises(deps).execute(input),
    'exercises:create': (input) => new CreateExercise(deps).execute(input),
    'exercises:update': (input) => new UpdateExercise(deps).execute(input),
    'exercises:deactivate': (input) => new DeactivateExercise(deps).execute(input),
    'exercises:history': (input) => new GetExerciseHistory(deps).execute(input),
    'exercises:set-increment': (input) => new SetExerciseIncrement(deps).execute(input),
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
    'workout-sessions:open': (input) => new GetOpenSession(deps).execute(input),
    'workout-sessions:start': (input) => new StartSession(deps).execute(input),
    'workout-sessions:finish': (input) => new FinishSession(deps).execute(input),
    'workout-sessions:discard': (input) => new DiscardSession(deps).execute(input),
    'workout-sets:update': (input) => new UpdateSet(deps).execute(input),
    'workout-sets:add': (input) => new AddSet(deps).execute(input),
    'workout-sets:remove': (input) => new RemoveSet(deps).execute(input),
    'workout-performances:add': (input) => new AddPerformance(deps).execute(input),
    'workout-performances:replace': (input) => new ReplacePerformance(deps).execute(input),
    'workout-performances:remove': (input) => new RemovePerformance(deps).execute(input),
  };
}
