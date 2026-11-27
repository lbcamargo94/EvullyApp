import { parseLocalDate } from '@evully/domain';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../src/database/connection';
import { migrateToLatest } from '../src/database/migrator';
import { buildApp } from '../src/main/composition-root';
import type { AppRestart, BackupDialogs } from '../src/modules/backup/ports/backup-ports';
import type { ExportFiles } from '../src/modules/exports/ports/export-ports';
import type { TransferFiles } from '../src/modules/transfer/ports/transfer-ports';
import type { HealthDocumentFiles } from '../src/modules/health/ports/health-repository';
import type { ImportFiles } from '../src/modules/imports/ports/import-ports';
import type { Updater } from '../src/modules/updates/ports/updater';
import { ReminderOpenBox } from '../src/modules/reminders/adapters/reminder-open-box';
import type { ReminderNotice } from '../src/modules/reminders/ports/reminder-ports';
import type { Clock, IdGenerator } from '../src/modules/shared/ports';

export const fixedClock = (
  iso = '2026-10-07T10:00:00.000Z',
  today = '2026-10-07',
  time = '07:00',
): Clock => ({
  nowIso: () => iso,
  today: () => parseLocalDate(today),
  localTime: () => time,
  // Tests run as if the user were in UTC.
  localToIso: (date, t) => `${date}T${t}:00.000Z`,
  isoToLocal: (iso) => ({ date: parseLocalDate(iso.slice(0, 10)), time: iso.slice(11, 16) }),
});

/** Deterministic UUID v7-shaped ids: …-7000-8000-000000000001, …0002, … */
export const sequentialIds = (): IdGenerator => {
  let n = 0;
  return {
    next: () => `01900000-0000-7000-8000-${String(++n).padStart(12, '0')}`,
  };
};

/** Dialogs that are always cancelled. */
export const noDialogs: BackupDialogs = {
  chooseSavePath: async () => null,
  chooseDirectory: async () => null,
  chooseBackupFile: async () => null,
};

/** Import dialogs that are always cancelled. */
export const noImportFiles: ImportFiles = {
  chooseCsv: async () => null,
  saveText: async () => false,
};

/** Export save dialogs that are always cancelled. */
export const noExportFiles: ExportFiles = {
  saveJson: async () => null,
  saveZip: async () => null,
};

/** Transfer dialogs that are always cancelled. */
export const noTransferFiles: TransferFiles = {
  save: async () => null,
  open: async () => null,
};

/** Exam PDF dialogs that are always cancelled; nothing is opened. */
export const noHealthFiles: HealthDocumentFiles = {
  choosePdf: async () => null,
  saveCopy: async () => false,
  open: async () => undefined,
};

/** Reminders that are never shown (seed). */
export const noReminders = () => ({
  notifier: { show: () => undefined },
  opens: new ReminderOpenBox(),
  onChange: () => undefined,
});

/** Updates are disabled in tests. */
export const noUpdates: Updater = {
  status: () => ({
    state: 'disabled',
    currentVersion: '0.0.0-test',
    availableVersion: null,
    progress: null,
    checkedAt: null,
    error: null,
  }),
  check: async () => noUpdates.status(),
  install: async () => null,
};

/** Migrated database in a temp folder plus the app's handlers wired to it. */
export async function createTestApp(
  clock: Clock = fixedClock(),
  dialogs: BackupDialogs = noDialogs,
  importFiles: ImportFiles = noImportFiles,
  restart: AppRestart = { restart: () => undefined },
  exportFiles: ExportFiles = noExportFiles,
  transferFiles: TransferFiles = noTransferFiles,
  healthFiles: HealthDocumentFiles = noHealthFiles,
) {
  const dir = mkdtempSync(join(tmpdir(), 'evully-test-'));
  const db = openDatabase(join(dir, 'evully.db'));
  await migrateToLatest(db);
  const ids = sequentialIds();
  const notices: ReminderNotice[] = [];
  const { handlers, lifecycle, reminders } = buildApp({
    db,
    clock,
    ids,
    appInfo: () => ({ version: '0.0.0-test', environment: 'development' }),
    legal: () => Promise.resolve({ license: 'LICENSE', thirdPartyNotices: 'NOTICES' }),
    openLogs: () => Promise.resolve(null),
    backup: {
      defaultDirectory: join(dir, 'backups'),
      tempDirectory: join(dir, 'tmp'),
      pendingRestoreFile: join(dir, 'restore-pending.db'),
      dialogs,
      restart,
    },
    importFiles,
    exportFiles,
    transferFiles,
    healthFiles,
    updater: noUpdates,
    reminders: {
      notifier: { show: (notice) => notices.push(notice) },
      opens: new ReminderOpenBox(),
      onChange: () => undefined,
    },
  });
  const dispose = async () => {
    await db.destroy();
    rmSync(dir, { recursive: true, force: true });
  };
  return { db, dir, handlers, lifecycle, reminders, notices, ids, dispose };
}

/** Narrows an optional test value, failing the test with a clear message when it is missing. */
export function must<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what} to exist`);
  return value;
}
