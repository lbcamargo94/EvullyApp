import { app, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { openDatabase } from '../database/connection';
import { hasPendingMigrations, migrateToLatest } from '../database/migrator';
import { systemClock, uuidV7Generator } from '../modules/shared/system-adapters';
import { buildApp } from './composition-root';
import { electronDialogs } from './electron-dialogs';
import { electronImportFiles } from './electron-import-files';
import { registerIpcHandlers } from './ipc-router';
import { backupsDirectory, configureDataDirectory, databaseFile, scratchDirectory } from './paths';

configureDataDirectory();
log.initialize();

const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
const isTrustedSender = (url: string) =>
  rendererUrl ? url.startsWith(rendererUrl) : url.startsWith('file://');

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    title: 'Evully',
    autoHideMenuBar: true,
    webPreferences: {
      // Sandboxed preloads must be CommonJS.
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedSender(url)) event.preventDefault();
  });

  if (rendererUrl) void window.loadURL(rendererUrl);
  else void window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
}

async function start(): Promise<void> {
  await app.whenReady();

  const file = databaseFile();
  const existed = existsSync(file);
  const db = openDatabase(file);
  const evully = buildApp({
    db,
    clock: systemClock,
    ids: uuidV7Generator,
    appInfo: () => ({
      version: app.getVersion(),
      environment: app.isPackaged ? 'production' : 'development',
    }),
    backup: {
      defaultDirectory: backupsDirectory(),
      tempDirectory: scratchDirectory(),
      dialogs: electronDialogs,
    },
    importFiles: electronImportFiles,
  });

  // Back up an existing database before changing its schema (README §6.4).
  if (existed && (await hasPendingMigrations(db))) {
    await evully.lifecycle.beforeMigrations().then(
      () => log.info('pre-migration backup created'),
      (error: unknown) => log.error('pre-migration backup failed', error),
    );
  }
  const applied = await migrateToLatest(db);
  if (applied.length) log.info(`migrations applied: ${applied.join(', ')}`);

  registerIpcHandlers(evully.handlers, isTrustedSender);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  // Automatic backup on close (README §8.7.2); a failure never blocks quitting.
  let closing = false;
  app.on('before-quit', (event) => {
    if (closing) return;
    closing = true;
    event.preventDefault();
    void evully.lifecycle
      .onClose()
      .then((result) => log.info(`automatic backup: ${result}`))
      .finally(async () => {
        await db.destroy();
        app.quit();
      });
  });
}

start().catch((error: unknown) => {
  log.error('startup failed', error);
  app.exit(1);
});
