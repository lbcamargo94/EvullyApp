import type { AppInfo } from '@evully/contracts';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/schema';
import { KyselyProfileRepository } from '../modules/profiles/adapters/kysely-profile-repository';
import { profileIpcHandlers } from '../modules/profiles/adapters/profile-ipc-handlers';
import { KyselySettingsRepository } from '../modules/settings/adapters/kysely-settings-repository';
import { settingsIpcHandlers } from '../modules/settings/adapters/settings-ipc-handlers';
import type { Clock, IdGenerator } from '../modules/shared/ports';
import { KyselyProjectRepository } from '../modules/tracking/adapters/kysely-project-repository';
import { KyselyTrackingRepository } from '../modules/tracking/adapters/kysely-tracking-repository';
import { trackingIpcHandlers } from '../modules/tracking/adapters/tracking-ipc-handlers';
import {
  KyselyTagRepository,
  KyselyWeightRepository,
} from '../modules/weights/adapters/kysely-weight-repository';
import { weightIpcHandlers } from '../modules/weights/adapters/weight-ipc-handlers';
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
  const projects = new KyselyProjectRepository(db);
  const tracking = new KyselyTrackingRepository(db, ids);
  const weights = new KyselyWeightRepository(db);
  const tags = new KyselyTagRepository(db);
  return {
    'app:info': appInfo,
    ...profileIpcHandlers(profiles, clock, ids),
    ...settingsIpcHandlers(settings, clock),
    ...trackingIpcHandlers({ profiles, projects, tracking, clock, ids }),
    ...weightIpcHandlers({ profiles, projects, weights, tags, clock, ids }),
  };
}
