import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkDatabase } from '../src/database/integrity';
import { buildRecovery } from '../src/main/recovery-root';
import { uuidV7Generator } from '../src/modules/shared/system-adapters';
import { createTestApp, fixedClock, must, noImportFiles } from './helpers';

const profile = (name: string) => ({ name, birthDate: null, sex: null, heightCm: null });

describe('database recovery (README §14.2.1)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const restarts: number[] = [];
    const app = await createTestApp(
      fixedClock(),
      {
        chooseSavePath: async () => null,
        chooseDirectory: async () => null,
        chooseBackupFile: async () => null,
      },
      noImportFiles,
      { restart: () => restarts.push(1) },
    );
    dispose = app.dispose;
    await app.handlers['profiles:create'](profile('Ana'));
    const backup = await app.lifecycle.beforeMigrations();
    // A database file that is not SQLite any more (e.g. a write cut by a power loss).
    mkdirSync(join(app.dir, 'damaged'), { recursive: true });
    const damagedFile = join(app.dir, 'damaged', 'evully.db');
    const garbage = Buffer.from('this is not an sqlite database'.repeat(200));
    const recovery = () => {
      writeFileSync(damagedFile, garbage);
      return buildRecovery({
        databaseFile: damagedFile,
        clock: fixedClock(),
        ids: uuidV7Generator,
        appInfo: () => ({ version: '0.0.0-test', environment: 'development' }),
        legal: () => Promise.resolve({ license: '', thirdPartyNotices: '' }),
        openLogs: () => Promise.resolve(null),
        backup: {
          defaultDirectory: join(app.dir, 'backups'),
          tempDirectory: join(app.dir, 'tmp'),
          pendingRestoreFile: join(app.dir, 'damaged', 'restore-pending.db'),
          dialogs: {
            chooseSavePath: async () => null,
            chooseDirectory: async () => null,
            chooseBackupFile: async () => null,
          },
          restart: { restart: () => restarts.push(1) },
        },
      });
    };
    return { ...app, backup, restarts, damagedFile, garbage, recovery };
  };

  it('tells a healthy, a missing and a damaged database apart', async () => {
    const { dir } = await setup();
    expect(checkDatabase(join(dir, 'evully.db'))).toBe('ok');
    expect(checkDatabase(join(dir, 'nothing-here.db'))).toBe('missing');
    const bad = join(dir, 'bad.db');
    writeFileSync(bad, 'not a database');
    expect(checkDatabase(bad)).toBe('damaged');
    // The check never changes the file it reads.
    expect(readFileSync(bad, 'utf8')).toBe('not a database');
  });

  it('restores a backup over a damaged database and keeps a copy of the damaged file', async () => {
    const app = await setup();
    const handlers = app.recovery();

    expect(await handlers['recovery:status'](undefined)).toEqual({ damaged: true });
    // Nothing else of the app runs on a damaged database.
    await expect(handlers['profiles:list'](undefined)).rejects.toMatchObject({
      code: 'app.recovery_mode',
    });

    const listed = await handlers['backup:restorable'](undefined);
    expect(listed).toEqual([expect.objectContaining({ fileName: app.backup.fileName })]);
    const preview = must(
      await handlers['backup:prepare-restore']({
        from: 'list',
        folder: 'default',
        fileName: app.backup.fileName,
      }),
    );
    expect(preview.profiles).toEqual(['Ana']);
    await handlers['backup:restore']({ token: preview.token });

    expect(app.restarts).toHaveLength(1);
    const files = readdirSync(join(app.dir, 'damaged'));
    expect(files).toContain('restore-pending.db');
    const kept = must(files.find((f) => f.startsWith('evully-danificado-')));
    expect(readFileSync(join(app.dir, 'damaged', kept))).toEqual(app.garbage);
    // The damaged original stays until the swap on the next start.
    expect(readFileSync(app.damagedFile)).toEqual(app.garbage);
  });

  it('only offers the default folder: the extra one is stored in the damaged database', async () => {
    const app = await setup();
    const handlers = app.recovery();
    await expect(
      handlers['backup:prepare-restore']({
        from: 'list',
        folder: 'extra',
        fileName: app.backup.fileName,
      }),
    ).rejects.toMatchObject({ code: 'backup.restore_not_found' });
  });
});
