import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  AddHabitExamples,
  CreateHabit,
  DeactivateHabit,
  GetHabitDay,
  ListHabits,
  MoveHabit,
  SetHabitLog,
  UpdateHabit,
  type HabitDeps,
} from '../application/manage-habits';

type HabitChannels =
  | 'habits:list'
  | 'habits:create'
  | 'habits:update'
  | 'habits:deactivate'
  | 'habits:move'
  | 'habits:add-examples'
  | 'habits:day'
  | 'habits:log';

export function habitIpcHandlers(deps: HabitDeps): Pick<IpcHandlers, HabitChannels> {
  return {
    'habits:list': (input) => new ListHabits(deps).execute(input),
    'habits:create': (input) => new CreateHabit(deps).execute(input),
    'habits:update': (input) => new UpdateHabit(deps).execute(input),
    'habits:deactivate': (input) => new DeactivateHabit(deps).execute(input),
    'habits:move': (input) => new MoveHabit(deps).execute(input),
    'habits:add-examples': (input) => new AddHabitExamples(deps).execute(input),
    'habits:day': (input) => new GetHabitDay(deps).execute(input),
    'habits:log': (input) => new SetHabitLog(deps).execute(input),
  };
}
