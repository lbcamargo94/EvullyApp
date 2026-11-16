import { shell } from 'electron';
import log from 'electron-log/main';
import { dirname } from 'node:path';

/** Opens the folder of the log file (README §8.10); the path never comes from the renderer. */
export async function openLogFolder(): Promise<null> {
  const error = await shell.openPath(dirname(log.transports.file.getFile().path));
  if (error) log.warn('could not open the log folder');
  return null;
}
