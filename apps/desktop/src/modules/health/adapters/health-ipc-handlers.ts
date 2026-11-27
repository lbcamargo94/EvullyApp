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
import {
  AttachHealthDocument,
  OpenHealthDocument,
  RemoveHealthDocument,
  SaveHealthDocumentCopy,
} from '../application/manage-health-documents';

type HealthChannels =
  | 'health:settings'
  | 'health:set-settings'
  | 'health:list'
  | 'health:register'
  | 'health:update'
  | 'health:delete'
  | 'health:attach-document'
  | 'health:open-document'
  | 'health:save-document'
  | 'health:remove-document';

export function healthIpcHandlers(deps: HealthDeps): Pick<IpcHandlers, HealthChannels> {
  return {
    'health:settings': (input) => new GetHealthSettings(deps).execute(input),
    'health:set-settings': (input) => new SetHealthSettings(deps).execute(input),
    'health:list': (input) => new ListHealthExams(deps).execute(input),
    'health:register': (input) => new RegisterHealthExam(deps).execute(input),
    'health:update': (input) => new UpdateHealthExam(deps).execute(input),
    'health:delete': (input) => new DeleteHealthExam(deps).execute(input),
    'health:attach-document': (input) => new AttachHealthDocument(deps).execute(input),
    'health:open-document': (input) => new OpenHealthDocument(deps).execute(input),
    'health:save-document': (input) => new SaveHealthDocumentCopy(deps).execute(input),
    'health:remove-document': (input) => new RemoveHealthDocument(deps).execute(input),
  };
}
