import { app, Menu, nativeImage, Notification, Tray, type BrowserWindow } from 'electron';
import log from 'electron-log/main';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ReminderOpenBox } from '../modules/reminders/adapters/reminder-open-box';
import type { Notifier } from '../modules/reminders/ports/reminder-ports';

/** Same id as electron-builder's `appId`, so Windows shows notifications as Evully's. */
export const APP_USER_MODEL_ID = 'br.com.evully.desktop';
/** Argument of the login item: start in the tray, without the window. */
export const HIDDEN_ARG = '--hidden';
const TICK_MS = 60_000;
/** While hidden, the daily automatic backup is tried once an hour (README §8.7.2). */
const BACKUP_EVERY_TICKS = 60;

/** Windows notifications; clicking one opens the window on the reminder's screen. */
export function electronNotifier(opens: ReminderOpenBox, showWindow: () => void): Notifier {
  return {
    show: (notice) => {
      if (!Notification.isSupported()) return;
      const notification = new Notification({ title: notice.title, body: notice.body });
      notification.on('click', () => {
        opens.set({ profileId: notice.profileId, route: notice.route });
        showWindow();
      });
      notification.show();
    },
  };
}

async function trayIcon() {
  const dev = join(app.getAppPath(), 'build', 'icon.ico');
  if (!app.isPackaged && existsSync(dev)) return nativeImage.createFromPath(dev);
  return app.getFileIcon(process.execPath, { size: 'small' });
}

/**
 * The tray while some profile has a reminder on (README §25): closing the
 * window keeps Evully running there, with "Abrir" and "Sair".
 */
export class ReminderTray {
  private tray: Tray | null = null;

  constructor(
    private readonly showWindow: () => void,
    private readonly quit: () => void,
  ) {}

  get active(): boolean {
    return this.tray !== null;
  }

  async update(on: boolean): Promise<void> {
    if (on && !this.tray) {
      this.tray = new Tray(await trayIcon());
      this.tray.setToolTip('Evully: lembretes ligados');
      this.tray.setContextMenu(
        Menu.buildFromTemplate([
          { label: 'Abrir o Evully', click: this.showWindow },
          { type: 'separator' },
          { label: 'Sair', click: this.quit },
        ]),
      );
      this.tray.on('click', this.showWindow);
    } else if (!on && this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

/** Checks the reminders every minute; failures are logged without user data. */
export function startReminderScheduler(options: {
  evaluate: () => Promise<number>;
  backupWhileHidden: () => Promise<unknown>;
  isHidden: () => boolean;
}): () => void {
  let ticks = 0;
  const tick = async () => {
    ticks++;
    await options.evaluate().catch((error: unknown) => log.error('reminders failed', error));
    if (options.isHidden() && ticks % BACKUP_EVERY_TICKS === 0) {
      await options
        .backupWhileHidden()
        .catch((error: unknown) => log.error('backup failed', error));
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), TICK_MS);
  return () => clearInterval(timer);
}

/** "Iniciar com o Windows" (Settings › Lembretes): only the installed app registers itself. */
export function applyStartWithWindows(on: boolean): void {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({ openAtLogin: on, args: [HIDDEN_ARG] });
}

export const startedHidden = () => process.argv.includes(HIDDEN_ARG);

export function showWindow(window: BrowserWindow | undefined): void {
  if (!window) return;
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}
