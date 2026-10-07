import { app, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import { join } from 'node:path';
import { openDatabase } from '../database/connection';
import { migrateToLatest } from '../database/migrator';
import { systemClock, uuidV7Generator } from '../modules/shared/system-adapters';
import { buildIpcHandlers } from './composition-root';
import { registerIpcHandlers } from './ipc-router';
import { configureDataDirectory, databaseFile } from './paths';

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

  const db = openDatabase(databaseFile());
  const applied = await migrateToLatest(db);
  if (applied.length) log.info(`migrations applied: ${applied.join(', ')}`);

  const handlers = buildIpcHandlers({
    db,
    clock: systemClock,
    ids: uuidV7Generator,
    appInfo: () => ({
      version: app.getVersion(),
      environment: app.isPackaged ? 'production' : 'development',
    }),
  });
  registerIpcHandlers(handlers, isTrustedSender);

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on('window-all-closed', () => {
    void db.destroy();
    if (process.platform !== 'darwin') app.quit();
  });
}

start().catch((error: unknown) => {
  log.error('startup failed', error);
  app.exit(1);
});
