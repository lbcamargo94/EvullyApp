import type { IpcHandlers } from '../../../shared/ipc-channels';
import { ConfirmImport } from '../application/confirm-import';
import { PreviewImport, type ImportDeps } from '../application/preview-import';
import { SaveImportTemplate } from '../application/save-import-template';

type ImportChannels = 'import:preview' | 'import:confirm' | 'import:cancel' | 'import:template';

export function importIpcHandlers(deps: ImportDeps): Pick<IpcHandlers, ImportChannels> {
  const preview = new PreviewImport(deps);
  const confirm = new ConfirmImport(deps);
  const template = new SaveImportTemplate(deps.tracking, deps.files);
  return {
    'import:preview': (input) => preview.execute(input),
    'import:confirm': (input) => confirm.execute(input),
    'import:cancel': ({ token }) => {
      deps.pending.discard(token);
      return null;
    },
    'import:template': (input) => template.execute(input),
  };
}
