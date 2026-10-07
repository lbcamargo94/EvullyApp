import type { AppInfo } from '@evully/contracts';

/**
 * Data port for the screens (FRONTEND.md §3.2). Each platform provides an
 * implementation: IPC on desktop, HTTP on web, local SQLite + sync on mobile.
 */
export interface EvullyClient {
  app: {
    info(): Promise<AppInfo>;
  };
}
