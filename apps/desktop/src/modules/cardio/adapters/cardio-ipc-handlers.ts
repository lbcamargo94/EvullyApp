import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  DeleteCardio,
  GetCardioOverview,
  RegisterCardio,
  SetCardioTarget,
  UpdateCardio,
  type CardioDeps,
} from '../application/manage-cardio';

type CardioChannels =
  'cardio:overview' | 'cardio:register' | 'cardio:update' | 'cardio:delete' | 'cardio-target:set';

export function cardioIpcHandlers(deps: CardioDeps): Pick<IpcHandlers, CardioChannels> {
  return {
    'cardio:overview': (input) => new GetCardioOverview(deps).execute(input),
    'cardio:register': (input) => new RegisterCardio(deps).execute(input),
    'cardio:update': (input) => new UpdateCardio(deps).execute(input),
    'cardio:delete': (input) => new DeleteCardio(deps).execute(input),
    'cardio-target:set': (input) => new SetCardioTarget(deps).execute(input),
  };
}
