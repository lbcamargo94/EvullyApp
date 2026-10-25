import type { AppInfo, LegalDocuments } from '@evully/contracts';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/schema';
import { backupIpcHandlers } from '../modules/backup/adapters/backup-ipc-handlers';
import { FsBackupFolder, FsBackupWriter } from '../modules/backup/adapters/fs-backup';
import { BackupSettings } from '../modules/backup/application/backup-settings';
import { CreateBackup, type BackupDeps } from '../modules/backup/application/create-backup';
import { RunAutomaticBackup } from '../modules/backup/application/run-automatic-backup';
import type { BackupDialogs } from '../modules/backup/ports/backup-ports';
import { importIpcHandlers } from '../modules/imports/adapters/import-ipc-handlers';
import { PendingImports } from '../modules/imports/application/pending-imports';
import type { ImportFiles } from '../modules/imports/ports/import-ports';
import { KyselyMeasurementRepository } from '../modules/measurements/adapters/kysely-measurement-repository';
import { measurementIpcHandlers } from '../modules/measurements/adapters/measurement-ipc-handlers';
import { KyselyFoodLogRepository } from '../modules/nutrition/adapters/kysely-food-log-repository';
import { KyselyFoodRepository } from '../modules/nutrition/adapters/kysely-food-repository';
import { KyselyMealTemplateRepository } from '../modules/nutrition/adapters/kysely-meal-template-repository';
import { nutritionIpcHandlers } from '../modules/nutrition/adapters/nutrition-ipc-handlers';
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
  /** LICENSE and THIRD_PARTY_NOTICES, read from the app resources. */
  legal: () => Promise<LegalDocuments>;
  backup: { defaultDirectory: string; tempDirectory: string; dialogs: BackupDialogs };
  importFiles: ImportFiles;
}

/** Wires adapters into use cases (ARCHITECTURE.md §3). The only place that knows every module. */
export function buildApp({ db, clock, ids, appInfo, legal, backup, importFiles }: Dependencies) {
  const profiles = new KyselyProfileRepository(db);
  const settings = new KyselySettingsRepository(db, clock, ids);
  const projects = new KyselyProjectRepository(db);
  const tracking = new KyselyTrackingRepository(db, ids);
  const weights = new KyselyWeightRepository(db);
  const tags = new KyselyTagRepository(db);
  const measurements = new KyselyMeasurementRepository(db);
  const foods = new KyselyFoodRepository(db);
  const foodLogs = new KyselyFoodLogRepository(db);
  const mealTemplates = new KyselyMealTemplateRepository(db);
  const backupSettings = new BackupSettings(settings);
  const backupDeps: BackupDeps = {
    writer: new FsBackupWriter(db, backup.tempDirectory),
    folder: new FsBackupFolder(),
    settings: backupSettings,
    clock,
    appVersion: appInfo().version,
  };

  const handlers: IpcHandlers = {
    'app:info': appInfo,
    'app:legal': legal,
    ...profileIpcHandlers(profiles, clock, ids, () =>
      new CreateBackup(backupDeps).execute({
        kind: 'pre-delete',
        directory: backup.defaultDirectory,
      }),
    ),
    ...settingsIpcHandlers(settings, clock),
    ...trackingIpcHandlers({ profiles, projects, tracking, clock, ids }),
    ...weightIpcHandlers({ profiles, projects, weights, tags, clock, ids }),
    ...measurementIpcHandlers({ profiles, projects, tracking, measurements, clock, ids }),
    ...nutritionIpcHandlers({
      profiles,
      foods,
      logs: foodLogs,
      templates: mealTemplates,
      clock,
      ids,
    }),
    ...backupIpcHandlers({
      backup: backupDeps,
      settings: backupSettings,
      dialogs: backup.dialogs,
      defaultDirectory: backup.defaultDirectory,
    }),
    ...importIpcHandlers({
      profiles,
      weights,
      measurements,
      tracking,
      files: importFiles,
      pending: new PendingImports(),
      clock,
      ids,
    }),
  };

  return {
    handlers,
    /** Lifecycle backups run by the main process (README §6.4, §8.7.2). */
    lifecycle: {
      onClose: () => new RunAutomaticBackup(backupDeps, backup.defaultDirectory).execute(),
      beforeMigrations: () =>
        new CreateBackup(backupDeps).execute({
          kind: 'pre-migration',
          directory: backup.defaultDirectory,
        }),
    },
  };
}
