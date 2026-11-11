import { parseLocalDate } from '@evully/domain';
import AdmZip from 'adm-zip';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { seedClock, seedDemo } from '../seed/demo-seed';
import type { ProfileExportDocument } from '../src/modules/exports/application/export-profile';
import type { ExportFiles } from '../src/modules/exports/ports/export-ports';
import { readTransferZip, writeTransferZip } from '../src/modules/transfer/adapters/transfer-zip';
import type { TransferFiles, TransferManifest } from '../src/modules/transfer/ports/transfer-ports';
import { createTestApp, must, noDialogs, noImportFiles } from './helpers';

const today = parseLocalDate('2026-11-03');
const folder = mkdtempSync(join(tmpdir(), 'evully-transfer-'));

/** Transfer dialogs on a temp folder: save keeps the suggested name, open reads `next`. */
function diskFiles() {
  const state: { saved: string | null; next: string | null } = { saved: null, next: null };
  const files: TransferFiles = {
    save: async (name, json, manifest) => {
      state.saved = join(folder, name);
      await writeTransferZip(state.saved, json, manifest);
      return name;
    },
    open: async () => (state.next ? readTransferZip(state.next) : null),
  };
  return { state, files };
}

/** JSON export captured in memory, to compare the data of two computers. */
function jsonCapture() {
  const state: { json: string | null } = { json: null };
  const files: ExportFiles = {
    saveJson: async (name, content) => {
      state.json = content;
      return name;
    },
    saveZip: async () => null,
  };
  return { state, files };
}

const app = (transfer: TransferFiles, exports: ExportFiles) =>
  createTestApp(seedClock(today), noDialogs, noImportFiles, undefined, exports, transfer);

async function exportData(
  handlers: Awaited<ReturnType<typeof app>>['handlers'],
  capture: ReturnType<typeof jsonCapture>,
  profileId: string,
) {
  await handlers['exports:create']({ profileId, format: 'json' });
  const doc = JSON.parse(must(capture.state.json, 'json')) as ProfileExportDocument;
  return doc.data;
}

const errorCode = (call: unknown) =>
  Promise.resolve(call).then(
    () => null,
    (e: { code?: string }) => e.code ?? String(e),
  );

describe('profile transfer between computers (README §14.4)', () => {
  const disk = diskFiles();
  const sourceJson = jsonCapture();
  let source: Awaited<ReturnType<typeof app>>;
  let demo: Awaited<ReturnType<typeof seedDemo>>;
  let zipPath = '';
  let dispose: () => Promise<void> = async () => {};

  beforeAll(async () => {
    source = await app(disk.files, sourceJson.files);
    const ana = await source.handlers['profiles:create']({
      name: 'Ana',
      birthDate: null,
      sex: null,
      heightCm: null,
    });
    await source.handlers['weights:register']({
      profileId: ana.id,
      measuredOn: today,
      measuredAt: '2026-11-03T11:00:00.000Z',
      weightKg: 61.2,
      tagIds: [],
      notes: null,
    });
    demo = await seedDemo(source.handlers, seedClock(today), today);
    const result = await source.handlers['transfer:export']({ profileId: demo.profileId });
    expect(result).toEqual({ fileName: 'evully-perfil-demo-2026-11-03.zip' });
    zipPath = must(disk.state.saved, 'zip');
  }, 120_000);
  afterEach(() => dispose());
  afterAll(async () => {
    await source.dispose();
    rmSync(folder, { recursive: true, force: true });
  });

  it('writes only profile.json and manifest.json, with the checksum', async () => {
    const zip = new AdmZip(zipPath);
    expect(
      zip
        .getEntries()
        .map((e) => e.entryName)
        .sort(),
    ).toEqual(['manifest.json', 'profile.json']);
    const opened = await readTransferZip(zipPath);
    expect(opened.manifest).toMatchObject({
      format: 'evully-profile-transfer',
      formatVersion: 1,
      profileId: demo.profileId,
      profileName: 'Demo',
      sha256: opened.sha256,
    });
    expect(opened.profileJson).not.toContain('Ana');
  });

  it('creates the profile on another computer with the same data, other profiles untouched', async () => {
    const targetJson = jsonCapture();
    const target = await app(disk.files, targetJson.files);
    dispose = target.dispose;
    const { handlers } = target;
    const bia = await handlers['profiles:create']({
      name: 'Bia',
      birthDate: null,
      sex: null,
      heightCm: null,
    });

    disk.state.next = zipPath;
    const preview = must(await handlers['transfer:prepare-import'](undefined), 'preview');
    expect(preview).toMatchObject({
      profileName: 'Demo',
      existing: null,
      counts: { weights: demo.weights, workouts: demo.workouts, sleep: demo.nights },
    });
    expect(await handlers['profiles:list'](undefined)).toHaveLength(1); // Nothing written yet.

    expect(await handlers['transfer:import']({ token: preview.token })).toEqual({
      profileId: demo.profileId,
      replaced: false,
    });
    const names = (await handlers['profiles:list'](undefined)).map((p) => p.name).sort();
    expect(names).toEqual(['Bia', 'Demo']);
    expect(await exportData(handlers, targetJson, demo.profileId)).toEqual(
      await exportData(source.handlers, sourceJson, demo.profileId),
    );
    expect((await handlers['workout-stats:get']({ profileId: demo.profileId })).length).toBe(
      demo.workouts,
    );
    expect(await handlers['weights:list']({ profileId: bia.id })).toEqual([]);
  });

  it('replaces the profile with the same id only after a backup', async () => {
    const target = await app(disk.files, jsonCapture().files);
    dispose = target.dispose;
    const { handlers } = target;
    disk.state.next = zipPath;
    const first = must(await handlers['transfer:prepare-import'](undefined), 'preview');
    await handlers['transfer:import']({ token: first.token });
    await handlers['weights:register']({
      profileId: demo.profileId,
      measuredOn: today,
      measuredAt: '2026-11-03T22:00:00.000Z',
      weightKg: 80,
      tagIds: [],
      notes: null,
    });

    const again = must(await handlers['transfer:prepare-import'](undefined), 'preview');
    expect(again.existing).toEqual({ name: 'Demo', archived: false });
    expect(await handlers['transfer:import']({ token: again.token })).toMatchObject({
      replaced: true,
    });
    expect(await handlers['weights:list']({ profileId: demo.profileId })).toHaveLength(
      demo.weights,
    );
    expect((await handlers['backup:status'](undefined)).lastBackup?.kind).toBe('pre-import');
  });

  it('writes nothing when cancelled', async () => {
    const target = await app(disk.files, jsonCapture().files);
    dispose = target.dispose;
    const { handlers } = target;
    disk.state.next = null;
    expect(await handlers['transfer:prepare-import'](undefined)).toBeNull();
    disk.state.next = zipPath;
    const preview = must(await handlers['transfer:prepare-import'](undefined), 'preview');
    await handlers['transfer:cancel']({ token: preview.token });
    expect(await errorCode(handlers['transfer:import']({ token: preview.token }))).toBe(
      'transfer.expired',
    );
    expect(await handlers['profiles:list'](undefined)).toEqual([]);
  });

  it('refuses damaged, newer, foreign or unknown content', async () => {
    const target = await app(disk.files, jsonCapture().files);
    dispose = target.dispose;
    const { handlers } = target;
    const opened = await readTransferZip(zipPath);
    const manifest = opened.manifest as TransferManifest;
    const meta: Omit<TransferManifest, 'sha256'> = { ...manifest };
    delete (meta as Partial<TransferManifest>).sha256;
    const doc = JSON.parse(opened.profileJson) as {
      data: Record<string, Record<string, unknown>[]>;
    };
    const attempt = async (name: string, write: (path: string) => Promise<void>) => {
      const path = join(folder, name);
      await write(path);
      disk.state.next = path;
      return errorCode(handlers['transfer:prepare-import'](undefined));
    };
    const withDoc = (change: (d: typeof doc) => void) => (path: string) => {
      const copy = structuredClone(doc);
      change(copy);
      return writeTransferZip(path, JSON.stringify(copy), meta);
    };

    expect(
      await attempt('tampered.zip', async (path) => {
        const zip = new AdmZip();
        zip.addFile('profile.json', Buffer.from(opened.profileJson.replace('Demo', 'Demx')));
        zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
        await zip.writeZipPromise(path);
      }),
    ).toBe('transfer.corrupt');
    expect(
      await attempt('newer.zip', (path) =>
        writeTransferZip(path, opened.profileJson, { ...meta, schemaVersion: '9999_future' }),
      ),
    ).toBe('transfer.newer');
    expect(
      await attempt('extra.zip', async (path) => {
        const zip = new AdmZip();
        zip.addFile('profile.json', Buffer.from(opened.profileJson));
        zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
        zip.addFile('../evil.txt', Buffer.from('x'));
        await zip.writeZipPromise(path);
      }),
    ).toBe('transfer.invalid');
    expect(
      await attempt(
        'foreign.zip',
        withDoc((d) => {
          must(d.data.body_weights?.[0], 'weight').profile_id =
            '01900000-0000-7000-8000-00000000ffff';
        }),
      ),
    ).toBe('transfer.invalid');
    expect(
      await attempt(
        'column.zip',
        withDoc((d) => {
          must(d.data.sleep_logs?.[0], 'night').evil = 'x';
        }),
      ),
    ).toBe('transfer.invalid');
    expect(
      await attempt(
        'table.zip',
        withDoc((d) => {
          d.data.app_secrets = [];
        }),
      ),
    ).toBe('transfer.invalid');
    expect(await handlers['profiles:list'](undefined)).toEqual([]);
  });
});
