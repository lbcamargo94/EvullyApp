import { app } from 'electron';
import { join } from 'node:path';

/**
 * Development uses a separate data folder so seeds and experiments never touch
 * real data (README §5.4). Must run before the app is ready.
 */
export function configureDataDirectory(): void {
  if (!app.isPackaged) {
    app.setPath('userData', join(app.getPath('appData'), 'Evully-dev'));
  }
}

export function databaseFile(): string {
  return join(app.getPath('userData'), 'evully.db');
}
