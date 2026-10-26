import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  CreateExercise,
  DeactivateExercise,
  ListExercises,
  UpdateExercise,
  type ExerciseDeps,
} from '../application/manage-exercises';

type WorkoutChannels =
  'exercises:list' | 'exercises:create' | 'exercises:update' | 'exercises:deactivate';

export function workoutIpcHandlers(deps: ExerciseDeps): Pick<IpcHandlers, WorkoutChannels> {
  return {
    'exercises:list': (input) => new ListExercises(deps).execute(input),
    'exercises:create': (input) => new CreateExercise(deps).execute(input),
    'exercises:update': (input) => new UpdateExercise(deps).execute(input),
    'exercises:deactivate': (input) => new DeactivateExercise(deps).execute(input),
  };
}
