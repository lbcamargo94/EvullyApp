import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { name: 'Lucas', birthDate: null, sex: null, heightCm: null };
const zipsIn = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.zip'))
        .sort()
    : [];

function readBackup(path: string) {
  const zip = new AdmZip(path);
  const manifest = JSON.parse(must(zip.getEntry('manifest.json')).getData().toString('utf8'));
  const db = must(zip.getEntry('evully.db')).getData();
  return { manifest, db };
}

describe('backup', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async (
    clock = fixedClock('2026-10-14T10:00:00.000Z', '2026-10-14', '07:05'),
    savePath: string | null = null,
    extraDir: string | null = null,
  ) => {
    const app = await createTestApp(clock, {
      chooseSavePath: async () => savePath,
      chooseDirectory: async () => extraDir,
    });
    dispose = app.dispose;
    await app.handlers['profiles:create'](person);
    return { ...app, backups: join(app.dir, 'backups') };
  };

  it('writes a zip with a consistent database and a manifest (README §8.7.1)', async () => {
    const { lifecycle, backups, dir } = await setup();
    const result = await lifecycle.beforeMigrations();
    expect(result.fileName).toBe('evully-backup-2026-10-14-0705.zip');

    const { manifest, db } = readBackup(join(backups, result.fileName));
    expect(manifest).toEqual({
      appVersion: '0.0.0-test',
      kind: 'pre-migration',
      createdAt: '2026-10-14T10:00:00.000Z',
      schemaVersion: '0006_foods',
      sha256: createHash('sha256').update(db).digest('hex'),
    });

    // The extracted database opens and holds the data.
    const restored = join(dir, 'restored.db');
    writeFileSync(restored, db);
    const sqlite = new Database(restored, { readonly: true });
    expect(sqlite.prepare('SELECT name FROM profiles').all()).toEqual([{ name: 'Lucas' }]);
    sqlite.close();
    expect(readdirSync(join(dir, 'tmp'))).toEqual([]);
  });

  it('manual backup saves where the user chose, or does nothing when cancelled', async () => {
    const cancelled = await setup();
    expect(await cancelled.handlers['backup:create-manual'](undefined)).toBeNull();
    await cancelled.dispose();

    const target = join(cancelled.dir, '..', `evully-manual-${Date.now()}.zip`);
    const { handlers } = await setup(undefined, target);
    const result = await handlers['backup:create-manual'](undefined);
    expect(must(result).fileName).toBe(target.split(/[\\/]/).at(-1));
    expect(readBackup(target).manifest.kind).toBe('manual');
    expect((await handlers['backup:status'](undefined)).lastBackup?.kind).toBe('manual');
  });

  it('runs the automatic backup at most once per day', async () => {
    const { handlers, lifecycle, backups } = await setup();
    expect(await lifecycle.onClose()).toBe('done');
    expect(await lifecycle.onClose()).toBe('skipped');
    expect(zipsIn(backups)).toHaveLength(1);
    expect((await handlers['backup:status'](undefined)).lastBackup?.kind).toBe('automatic');
  });

  it('copies to the extra folder and keeps the last 10 automatic copies only', async () => {
    let day = 1;
    const clock = {
      nowIso: () => `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
      today: () => `2026-10-${String(day).padStart(2, '0')}` as never,
      localTime: () => '07:00',
      localToIso: (date: string, t: string) => `${date}T${t}:00.000Z`,
    };
    const extraHolder: { dir: string } = { dir: '' };
    const app = await createTestApp(clock, {
      chooseSavePath: async () => null,
      chooseDirectory: async () => extraHolder.dir,
    });
    dispose = app.dispose;
    extraHolder.dir = join(app.dir, 'onedrive');
    await app.handlers['backup:choose-extra-directory']({ clear: false });

    const backups = join(app.dir, 'backups');
    mkdirSync(backups, { recursive: true });
    writeFileSync(join(backups, 'not-evully.zip'), 'x');
    await app.lifecycle.beforeMigrations();

    for (day = 1; day <= 12; day++) expect(await app.lifecycle.onClose()).toBe('done');

    const local = zipsIn(backups);
    expect(local).toContain('not-evully.zip');
    expect(local).toContain('evully-backup-2026-10-12-0700.zip'); // newest
    expect(local).not.toContain('evully-backup-2026-10-02-0700.zip'); // pruned
    // 10 automatic + 1 pre-migration + 1 unrelated file.
    expect(local).toHaveLength(12);
    expect(zipsIn(extraHolder.dir)).toHaveLength(10);
    expect((await app.handlers['backup:status'](undefined)).extraDirectory).toBe(extraHolder.dir);
  });

  it('records a failure without throwing and shows it until dismissed', async () => {
    const { handlers, lifecycle, dir } = await setup();
    // A file where the backups folder should be makes the write fail.
    writeFileSync(join(dir, 'backups'), 'blocking file');
    expect(await lifecycle.onClose()).toBe('failed');
    expect((await handlers['backup:status'](undefined)).lastError?.at).toBe(
      '2026-10-14T10:00:00.000Z',
    );
    expect((await handlers['backup:dismiss-error'](undefined)).lastError).toBeNull();
  });

  it('can turn the automatic backup off', async () => {
    const { handlers, lifecycle } = await setup();
    const status = await handlers['backup:set-automatic']({ automaticEnabled: false });
    expect(status.automaticEnabled).toBe(false);
    expect(await lifecycle.onClose()).toBe('skipped');
  });
});
