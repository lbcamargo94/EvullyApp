import { NotFoundError } from '@evully/domain';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyPendingRestore } from '../src/modules/backup/adapters/fs-backup-reader';
import { createTestApp, fixedClock, must, noImportFiles } from './helpers';

const profile = (name: string) => ({ name, birthDate: null, sex: null, heightCm: null });
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** Copies a backup zip, changing its database, manifest or entries. */
function rewrite(
  source: string,
  target: string,
  change: {
    db?: (sqlite: Database.Database) => void;
    bytes?: Buffer;
    manifest?: (m: Record<string, unknown>) => Record<string, unknown>;
    extra?: string;
  },
) {
  const zip = new AdmZip(source);
  let bytes = must(zip.getEntry('evully.db')).getData();
  if (change.db) {
    const file = `${target}.db`;
    writeFileSync(file, bytes);
    const sqlite = new Database(file);
    change.db(sqlite);
    sqlite.close();
    bytes = readFileSync(file);
  }
  if (change.bytes) bytes = change.bytes;
  const manifest = JSON.parse(must(zip.getEntry('manifest.json')).getData().toString('utf8'));
  const next = change.manifest
    ? change.manifest({ ...manifest, sha256: sha(bytes) })
    : { ...manifest, sha256: sha(bytes) };
  const out = new AdmZip();
  out.addFile('evully.db', bytes);
  out.addFile('manifest.json', Buffer.from(JSON.stringify(next)));
  if (change.extra) out.addFile(change.extra, Buffer.from('x'));
  out.writeZip(target);
  return target;
}

describe('restore a backup (README §14.2)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async (chosen: { path: string | null } = { path: null }) => {
    const restarts: number[] = [];
    const app = await createTestApp(
      fixedClock(),
      {
        chooseSavePath: async () => null,
        chooseDirectory: async () => null,
        chooseBackupFile: async () => chosen.path,
      },
      noImportFiles,
      { restart: () => restarts.push(1) },
    );
    dispose = app.dispose;
    await app.handlers['profiles:create'](profile('Ana'));
    const backup = await app.lifecycle.beforeMigrations();
    await app.handlers['profiles:create'](profile('Bruno'));
    return { ...app, backup, restarts };
  };

  it('previews a listed backup, backs up the current data, stages it and restarts', async () => {
    const { handlers, dir, backup, restarts } = await setup();
    const listed = await handlers['backup:restorable'](undefined);
    expect(listed).toEqual([
      expect.objectContaining({
        folder: 'default',
        fileName: backup.fileName,
        kind: 'pre-migration',
      }),
    ]);

    const preview = must(
      await handlers['backup:prepare-restore']({
        from: 'list',
        folder: 'default',
        fileName: backup.fileName,
      }),
    );
    expect(preview).toMatchObject({
      fileName: backup.fileName,
      kind: 'pre-migration',
      profiles: ['Ana'],
    });

    await handlers['backup:restore']({ token: preview.token });
    expect(restarts).toHaveLength(1);
    const kinds = (await handlers['backup:restorable'](undefined)).map((b) => b.kind);
    expect(kinds).toContain('pre-restore');
    expect(existsSync(join(dir, 'restore-pending.db'))).toBe(true);
    // The token is used once.
    await expect(handlers['backup:restore']({ token: preview.token })).rejects.toThrow(
      NotFoundError,
    );

    // On the next start the staged database replaces the current one.
    const target = join(dir, 'next-start.db');
    copyFileSync(join(dir, 'evully.db'), target);
    writeFileSync(`${target}-wal`, 'stale');
    expect(applyPendingRestore(target, join(dir, 'restore-pending.db'))).toBe(true);
    expect(existsSync(`${target}-wal`)).toBe(false);
    const restored = new Database(target, { readonly: true });
    const names = restored.prepare('SELECT name FROM profiles').all();
    restored.close();
    expect(names).toEqual([{ name: 'Ana' }]);
    expect(applyPendingRestore(target, join(dir, 'restore-pending.db'))).toBe(false);
  });

  it('accepts a file picked in the dialog and returns null when cancelled', async () => {
    const chosen: { path: string | null } = { path: null };
    const { handlers, dir, backup } = await setup(chosen);
    expect(await handlers['backup:prepare-restore']({ from: 'dialog' })).toBeNull();
    chosen.path = join(dir, 'backups', backup.fileName);
    const preview = await handlers['backup:prepare-restore']({ from: 'dialog' });
    expect(preview?.profiles).toEqual(['Ana']);
  });

  it('only opens files listed in the backup folders', async () => {
    const { handlers } = await setup();
    await expect(
      handlers['backup:prepare-restore']({
        from: 'list',
        folder: 'default',
        fileName: 'other.zip',
      }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      handlers['backup:prepare-restore']({ from: 'list', folder: 'extra', fileName: 'x.zip' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('refuses tampered, damaged, newer or unexpected backups', async () => {
    const chosen: { path: string | null } = { path: null };
    const { handlers, dir, backup } = await setup(chosen);
    const source = join(dir, 'backups', backup.fileName);
    const attempt = (path: string) => {
      chosen.path = path;
      return handlers['backup:prepare-restore']({ from: 'dialog' });
    };
    const code = (c: string) => expect.objectContaining({ code: c });

    await expect(
      attempt(
        rewrite(source, join(dir, 'tampered.zip'), { manifest: (m) => ({ ...m, sha256: 'x' }) }),
      ),
    ).rejects.toThrow(code('backup.restore_corrupt'));
    await expect(
      attempt(rewrite(source, join(dir, 'garbage.zip'), { bytes: Buffer.from('not a database') })),
    ).rejects.toThrow(code('backup.restore_corrupt'));
    await expect(
      attempt(
        rewrite(source, join(dir, 'newer.zip'), {
          db: (s) =>
            s
              .prepare('INSERT INTO kysely_migration (name, timestamp) VALUES (?, ?)')
              .run('9999_future', '2030-01-01T00:00:00.000Z'),
        }),
      ),
    ).rejects.toThrow(code('backup.restore_newer'));
    await expect(
      attempt(rewrite(source, join(dir, 'slip.zip'), { extra: '../evil.txt' })),
    ).rejects.toThrow(code('backup.restore_invalid'));
    writeFileSync(join(dir, 'plain.zip'), 'not a zip');
    await expect(attempt(join(dir, 'plain.zip'))).rejects.toThrow(code('backup.restore_invalid'));

    // Refused backups leave nothing behind in the scratch folder.
    const scratch = existsSync(join(dir, 'tmp')) ? readdirSync(join(dir, 'tmp')) : [];
    expect(scratch.filter((f) => f.endsWith('.db'))).toEqual([]);
  });
});
