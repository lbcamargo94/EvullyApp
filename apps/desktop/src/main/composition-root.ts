import type { AppInfo } from '@evully/contracts';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/schema';
import { KyselyProfileRepository } from '../modules/profiles/adapters/kysely-profile-repository';
import { profileIpcHandlers } from '../modules/profiles/adapters/profile-ipc-handlers';
import { KyselySettingsRepository } from '../modules/settings/adapters/kysely-settings-repository';
import { settingsIpcHandlers } from '../modules/settings/adapters/settings-ipc-handlers';
import type { Clock, IdGenerator } from '../modules/shared/ports';
import type { IpcHandlers } from '../shared/ipc-channels';

interface Dependencies {
  db: Kysely<DatabaseSchema>;
  clock: Clock;
  ids: IdGenerator;
  appInfo: () => AppInfo;
}

/** Wires adapters into use cases (ARCHITECTURE.md §3). The only place that knows every module. */
export function buildIpcHandlers({ db, clock, ids, appInfo }: Dependencies): IpcHandlers {
  const profiles = new KyselyProfileRepository(db);
  const settings = new KyselySettingsRepository(db, clock, ids);
  return {
    'app:info': appInfo,
    ...profileIpcHandlers(profiles, clock, ids),
    ...settingsIpcHandlers(settings, clock),
  };
}
