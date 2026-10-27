import type { UpdateStatus } from '@evully/contracts';

/** Automatic updates (SECURITY.md §2.8). Installs only a downloaded, verified update. */
export interface Updater {
  status(): UpdateStatus;
  check(): Promise<UpdateStatus>;
  /** Closes the app safely and runs the installer; fails unless an update is ready. */
  install(): Promise<null>;
}
