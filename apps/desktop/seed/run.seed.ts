import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'vitest';
import { openDatabase } from '../src/database/connection';
import { migrateToLatest } from '../src/database/migrator';
import { buildApp } from '../src/main/composition-root';
import { systemClock, uuidV7Generator } from '../src/modules/shared/system-adapters';
import { noDialogs, noImportFiles, noUpdates } from '../tests/helpers';
import { seedClock, seedDemo } from './demo-seed';

/**
 * `npm run seed`: adds the demo profile to the development database only
 * (%APPDATA%\Evully-dev, the folder `npm run dev` uses), never to the
 * installed app's data. Close the app before running it.
 */
test('seed the development database', { timeout: 600_000 }, async () => {
  const appData = process.env.APPDATA;
  if (!appData) throw new Error('APPDATA is not set: the seed only runs on Windows');
  const folder = join(appData, 'Evully-dev');
  mkdirSync(folder, { recursive: true });
  const db = openDatabase(join(folder, 'evully.db'));
  try {
    await migrateToLatest(db);
    const today = systemClock.today();
    const clock = seedClock(today);
    const { handlers } = buildApp({
      db,
      clock,
      ids: uuidV7Generator,
      appInfo: () => ({ version: '0.0.0-seed', environment: 'development' }),
      legal: () => Promise.resolve({ license: '', thirdPartyNotices: '' }),
      backup: {
        defaultDirectory: join(folder, 'backups'),
        tempDirectory: join(folder, 'tmp'),
        dialogs: noDialogs,
      },
      importFiles: noImportFiles,
      updater: noUpdates,
    });
    const { days, weights, workouts, cardio, nights } = await seedDemo(handlers, clock, today);
    console.log(`Demo profile created in ${folder}:`, { days, weights, workouts, cardio, nights });
  } finally {
    await db.destroy();
  }
});
