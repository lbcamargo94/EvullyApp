import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  DeleteHealthExam,
  GetHealthSettings,
  ListHealthExams,
  RegisterHealthExam,
  SetHealthSettings,
  UpdateHealthExam,
  type HealthDeps,
} from '../application/manage-health';

type HealthChannels =
  | 'health:settings'
  | 'health:set-settings'
  | 'health:list'
  | 'health:register'
  | 'health:update'
  | 'health:delete';

export function healthIpcHandlers(deps: HealthDeps): Pick<IpcHandlers, HealthChannels> {
  return {
    'health:settings': (input) => new GetHealthSettings(deps).execute(input),
    'health:set-settings': (input) => new SetHealthSettings(deps).execute(input),
    'health:list': (input) => new ListHealthExams(deps).execute(input),
    'health:register': (input) => new RegisterHealthExam(deps).execute(input),
    'health:update': (input) => new UpdateHealthExam(deps).execute(input),
    'health:delete': (input) => new DeleteHealthExam(deps).execute(input),
  };
}
