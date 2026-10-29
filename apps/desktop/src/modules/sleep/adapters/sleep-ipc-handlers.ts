import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  DeleteSleep,
  GetSleepTarget,
  ListSleep,
  RegisterSleep,
  SetSleepTarget,
  UpdateSleep,
  type SleepDeps,
} from '../application/manage-sleep';

type SleepChannels =
  | 'sleep:list'
  | 'sleep:register'
  | 'sleep:update'
  | 'sleep:delete'
  | 'sleep-target:get'
  | 'sleep-target:set';

export function sleepIpcHandlers(deps: SleepDeps): Pick<IpcHandlers, SleepChannels> {
  return {
    'sleep:list': (input) => new ListSleep(deps).execute(input),
    'sleep:register': (input) => new RegisterSleep(deps).execute(input),
    'sleep:update': (input) => new UpdateSleep(deps).execute(input),
    'sleep:delete': (input) => new DeleteSleep(deps).execute(input),
    'sleep-target:get': (input) => new GetSleepTarget(deps).execute(input),
    'sleep-target:set': (input) => new SetSleepTarget(deps).execute(input),
  };
}
