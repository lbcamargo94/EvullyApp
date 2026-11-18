import { app, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { openDatabase } from '../database/connection';
import { checkDatabase } from '../database/integrity';
import { hasPendingMigrations, migrateToLatest } from '../database/migrator';
import { applyPendingRestore } from '../modules/backup/adapters/fs-backup-reader';
import { systemClock, uuidV7Generator } from '../modules/shared/system-adapters';
import { ElectronUpdater } from './auto-update';
import { buildApp } from './composition-root';
import { readLegalDocuments } from './legal';
import { openLogFolder } from './logs';
import { withNativeTheme } from './native-theme';
import { electronDialogs } from './electron-dialogs';
import { electronExportFiles } from './electron-export-files';
import { electronImportFiles } from './electron-import-files';
import { electronTransferFiles } from './electron-transfer-files';
import { registerIpcHandlers } from './ipc-router';
import { buildRecovery } from './recovery-root';
import {
  backupsDirectory,
  configureDataDirectory,
  databaseFile,
  pendingRestoreFile,
  scratchDirectory,
} from './paths';

configureDataDirectory();
log.initialize();
// Unexpected failures are recorded (README §8.10, criterion 14); messages carry no user data.
process.on('uncaughtException', (error) => log.error('uncaught exception', error));
process.on('unhandledRejection', (reason) => log.error('unhandled rejection', reason));

const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
const isTrustedSender = (url: string) =>
  rendererUrl ? url.startsWith(rendererUrl) : url.startsWith('file://');

/**
 * The packaged app takes its icon from the executable (electron-builder,
 * build/icon.ico); in development the window would show Electron's default.
 */
const devIcon = app.isPackaged ? undefined : join(app.getAppPath(), 'build', 'icon.ico');

function createWindow(): void {
  const window = new BrowserWindow({
    ...(devIcon && existsSync(devIcon) ? { icon: devIcon } : {}),
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
  window.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason !== 'clean-exit') {
      log.error(`renderer gone: ${details.reason} (exit ${details.exitCode})`);
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedSender(url)) event.preventDefault();
  });

  if (rendererUrl) void window.loadURL(rendererUrl);
  else void window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
}

const appInfo = () => ({
  version: app.getVersion(),
  environment: app.isPackaged ? ('production' as const) : ('development' as const),
});

/** Restarts after a restore; the staged database replaces the current one on the next start. */
const restart = {
  restart: () =>
    setImmediate(() => {
      app.relaunch();
      app.quit();
    }),
};

function backupPaths() {
  return {
    defaultDirectory: backupsDirectory(),
    tempDirectory: scratchDirectory(),
    pendingRestoreFile: pendingRestoreFile(),
    dialogs: electronDialogs,
    restart,
  };
}

/** The database cannot be read: offer the backups instead of the app (README §14.2.1). */
function startRecovery(file: string): void {
  log.error('database failed the integrity check: recovery mode');
  const handlers = buildRecovery({
    databaseFile: file,
    clock: systemClock,
    ids: uuidV7Generator,
    appInfo,
    legal: readLegalDocuments,
    openLogs: openLogFolder,
    backup: backupPaths(),
  });
  registerIpcHandlers(handlers, isTrustedSender);
  createWindow();
  app.on('window-all-closed', () => app.quit());
}

async function start(): Promise<void> {
  await app.whenReady();

  const file = databaseFile();
  // A confirmed restore replaces the database before it opens (README §14.2).
  if (applyPendingRestore(file, pendingRestoreFile())) log.info('backup restored');
  if (checkDatabase(file) === 'damaged') return startRecovery(file);
  const existed = existsSync(file);
  const db = openDatabase(file);

  // Automatic backup on close (README §8.7.2); a failure never blocks quitting.
  let closing = false;
  const shutdown = async () => {
    closing = true;
    await evully.lifecycle
      .onClose()
      .then((result) => log.info(`automatic backup: ${result}`))
      .finally(() => db.destroy());
  };
  const updater = new ElectronUpdater({
    channel: async () => (await evully.handlers['settings:get'](undefined)).updateChannel,
    beforeInstall: shutdown,
  });

  const evully = buildApp({
    db,
    clock: systemClock,
    ids: uuidV7Generator,
    appInfo,
    legal: readLegalDocuments,
    openLogs: openLogFolder,
    backup: backupPaths(),
    importFiles: electronImportFiles,
    exportFiles: electronExportFiles,
    transferFiles: electronTransferFiles,
    updater,
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

  const handlers = withNativeTheme(evully.handlers);
  await handlers['settings:get'](undefined); // applies the saved theme before the window opens
  registerIpcHandlers(handlers, isTrustedSender);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', (event) => {
    if (closing) return;
    event.preventDefault();
    void shutdown().finally(() => {
      updater.installOnQuit();
      app.quit();
    });
  });
  updater.start();
}

start().catch((error: unknown) => {
  log.error('startup failed', error);
  app.exit(1);
});
