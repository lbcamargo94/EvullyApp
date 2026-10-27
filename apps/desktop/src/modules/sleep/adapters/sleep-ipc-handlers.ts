import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  DeleteSleep,
  ListSleep,
  RegisterSleep,
  UpdateSleep,
  type SleepDeps,
} from '../application/manage-sleep';

type SleepChannels = 'sleep:list' | 'sleep:register' | 'sleep:update' | 'sleep:delete';

export function sleepIpcHandlers(deps: SleepDeps): Pick<IpcHandlers, SleepChannels> {
  return {
    'sleep:list': (input) => new ListSleep(deps).execute(input),
    'sleep:register': (input) => new RegisterSleep(deps).execute(input),
    'sleep:update': (input) => new UpdateSleep(deps).execute(input),
    'sleep:delete': (input) => new DeleteSleep(deps).execute(input),
  };
}
