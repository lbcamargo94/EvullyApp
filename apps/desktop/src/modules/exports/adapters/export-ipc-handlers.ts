import type { IpcHandlers } from '../../../shared/ipc-channels';
import { ExportProfile, type ExportDeps } from '../application/export-profile';

export function exportIpcHandlers(deps: ExportDeps): Pick<IpcHandlers, 'exports:create'> {
  const exportProfile = new ExportProfile(deps);
  return { 'exports:create': (input) => exportProfile.execute(input) };
}
