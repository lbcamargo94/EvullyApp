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
import { withStartWithWindows } from './start-with-windows';
import { electronDialogs } from './electron-dialogs';
import { electronExportFiles } from './electron-export-files';
import { electronImportFiles } from './electron-import-files';
import { clearHealthViewerCopies, electronHealthFiles } from './electron-health-files';
import { electronTransferFiles } from './electron-transfer-files';
import { registerIpcHandlers } from './ipc-router';
import { buildRecovery } from './recovery-root';
import { ReminderOpenBox } from '../modules/reminders/adapters/reminder-open-box';
import {
  APP_USER_MODEL_ID,
  applyStartWithWindows,
  electronNotifier,
  ReminderTray,
  showWindow,
  startedHidden,
  startReminderScheduler,
} from './reminders-shell';
import {
  backupsDirectory,
  configureDataDirectory,
  databaseFile,
  pendingRestoreFile,
  healthViewerDirectory,
  scratchDirectory,
} from './paths';

configureDataDirectory();
log.initialize();
app.setAppUserModelId(APP_USER_MODEL_ID);
// One Evully per data folder: opening it again brings the running window back
// (the tray keeps it running, README §25).
if (!app.requestSingleInstanceLock()) app.exit(0);
let mainWindow: BrowserWindow | undefined;
app.on('second-instance', () => showWindow(mainWindow));
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

function createWindow(hidden = false): BrowserWindow {
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

  window.once('ready-to-show', () => {
    if (!hidden) window.show();
  });
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
  mainWindow = window;
  return window;
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
  await clearHealthViewerCopies(healthViewerDirectory());
  const existed = existsSync(file);
  const db = openDatabase(file);

  // Automatic backup on close (README §8.7.2); a failure never blocks quitting.
  let closing = false;
  const shutdown = async () => {
    closing = true;
    await clearHealthViewerCopies(healthViewerDirectory());
    await evully.lifecycle
      .onClose()
      .then((result) => log.info(`automatic backup: ${result}`))
      .finally(() => db.destroy());
  };
  const updater = new ElectronUpdater({
    channel: async () => (await evully.handlers['settings:get'](undefined)).updateChannel,
    beforeInstall: shutdown,
  });

  const opens = new ReminderOpenBox();
  const tray = new ReminderTray(
    () => showWindow(mainWindow ?? createWindow()),
    () => app.quit(),
  );
  const syncTray = () =>
    void evully.reminders
      .anyOn()
      .then((on) => tray.update(on))
      .catch((error: unknown) => log.error('tray update failed', error));

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
    healthFiles: electronHealthFiles(healthViewerDirectory()),
    updater,
    reminders: {
      notifier: electronNotifier(opens, () => showWindow(mainWindow ?? createWindow())),
      opens,
      onChange: syncTray,
    },
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

  const handlers = withStartWithWindows(withNativeTheme(evully.handlers));
  // Applies the saved theme before the window opens, and the login item.
  applyStartWithWindows((await handlers['settings:get'](undefined)).startWithWindows);
  registerIpcHandlers(handlers, isTrustedSender);
  await tray.update(await evully.reminders.anyOn());
  // Started by Windows with reminders on: stay in the tray (README §25).
  const window = createWindow(startedHidden() && tray.active);
  // With a reminder on, closing the window keeps Evully in the tray.
  window.on('close', (event) => {
    if (closing || !tray.active) return;
    event.preventDefault();
    window.hide();
  });
  startReminderScheduler({
    evaluate: () => evully.reminders.evaluate(),
    backupWhileHidden: () => evully.lifecycle.onClose(),
    isHidden: () => !window.isVisible(),
  });
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
