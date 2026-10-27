import type { UpdateChannel, UpdateStatus } from '@evully/contracts';
import { ConflictError } from '@evully/domain';
import { app, net } from 'electron';
import log from 'electron-log/main';
import updaterPackage, { type UpdateDownloadedEvent } from 'electron-updater';
import { isUpdateVersion, verifyUpdateFile } from '../modules/updates/adapters/update-signature';
import type { Updater } from '../modules/updates/ports/updater';
import { UPDATE_PUBLIC_KEY } from './update-public-key';

const { autoUpdater } = updaterPackage;

/** Public repository with only installers (README §33); matches electron-builder.yml. */
const RELEASES = 'https://github.com/lbcamargo94/evully-releases/releases/download';
const FIRST_CHECK_MS = 10_000;

interface Options {
  channel: () => Promise<UpdateChannel>;
  /** Backup on close and database shutdown, before the installer runs. */
  beforeInstall: () => Promise<void>;
}

/**
 * electron-updater over GitHub Releases. Downloads in the background, then
 * checks our Ed25519 signature; only a verified update can be installed: when
 * the user asks, or when the app closes. Checks only on start and on request.
 */
export class ElectronUpdater implements Updater {
  private current: UpdateStatus = {
    state: app.isPackaged ? 'idle' : 'disabled',
    currentVersion: app.getVersion(),
    availableVersion: null,
    progress: null,
    checkedAt: null,
    error: null,
  };

  constructor(private readonly options: Options) {}

  start(): void {
    if (this.current.state === 'disabled') return;
    autoUpdater.logger = null; // our own messages carry no paths or user data
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.on('checking-for-update', () => this.set({ state: 'checking', error: null }));
    autoUpdater.on('update-not-available', () =>
      this.set({ state: 'up_to_date', checkedAt: new Date().toISOString() }),
    );
    autoUpdater.on('update-available', (info) =>
      this.set({ state: 'downloading', availableVersion: info.version, progress: 0 }),
    );
    autoUpdater.on('download-progress', (p) => this.set({ progress: Math.round(p.percent) }));
    autoUpdater.on('update-downloaded', (event) => void this.verify(event));
    autoUpdater.on('error', (error) => {
      // First line only: no headers or tokens from the request dump.
      log.warn(`update failed: ${error.message.split('\n')[0]?.slice(0, 200) ?? ''}`);
      const network = /net::|ENOTFOUND|ECONN|ETIMEDOUT|404|status code/i.test(error.message);
      this.set({ state: 'error', error: network ? 'network' : 'unknown', progress: null });
    });
    setTimeout(() => void this.check(), FIRST_CHECK_MS);
  }

  status(): UpdateStatus {
    return this.current;
  }

  async check(): Promise<UpdateStatus> {
    if (['disabled', 'checking', 'downloading', 'ready'].includes(this.current.state)) {
      return this.current;
    }
    autoUpdater.allowPrerelease = (await this.options.channel()) === 'prerelease';
    await autoUpdater.checkForUpdates().catch(() => null); // reported by the 'error' event
    return this.current;
  }

  async install(): Promise<null> {
    if (this.current.state !== 'ready') {
      throw new ConflictError('update.not_ready', 'No verified update is ready');
    }
    log.info(`installing update ${this.current.availableVersion ?? ''}`);
    await this.options.beforeInstall();
    autoUpdater.quitAndInstall(true, true);
    app.quit(); // in case the installer could not start, the app still closes cleanly
    return null;
  }

  /** Called on quit, after the close backup: installs a verified update without reopening. */
  installOnQuit(): void {
    if (this.current.state !== 'ready') return;
    log.info(`installing update ${this.current.availableVersion ?? ''} on quit`);
    autoUpdater.quitAndInstall(true, false);
  }

  private async verify(event: UpdateDownloadedEvent): Promise<void> {
    const ok = isUpdateVersion(event.version) && (await this.signatureMatches(event));
    if (ok) {
      log.info(`update ${event.version} downloaded and verified`);
      this.set({ state: 'ready', availableVersion: event.version, progress: 100 });
    } else {
      log.warn(`update ${event.version} rejected: invalid signature`);
      this.set({ state: 'error', error: 'signature', progress: null });
    }
  }

  private async signatureMatches(event: UpdateDownloadedEvent): Promise<boolean> {
    const url = `${RELEASES}/v${event.version}/Evully-Setup-${event.version}.exe.sig`;
    try {
      const response = await net.fetch(url);
      if (!response.ok) return false;
      return verifyUpdateFile(
        event.downloadedFile,
        event.version,
        await response.text(),
        UPDATE_PUBLIC_KEY,
      );
    } catch {
      return false;
    }
  }

  private set(patch: Partial<UpdateStatus>): void {
    this.current = { ...this.current, ...patch };
  }
}
