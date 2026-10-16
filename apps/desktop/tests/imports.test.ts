import { NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import type { ImportFiles } from '../src/modules/imports/ports/import-ports';
import { createTestApp, fixedClock, must } from './helpers';

const person = { name: 'Lucas', birthDate: null, sex: null, heightCm: null };

/** Fake dialogs: "chooses" the given CSV and records saved templates. */
function fakeFiles(csv: { text: string } = { text: '' }) {
  const saved: { name: string; content: string }[] = [];
  const files: ImportFiles = {
    chooseCsv: async () => ({ fileName: 'dados.csv', text: csv.text }),
    saveText: async (name, content) => {
      saved.push({ name, content });
      return true;
    },
  };
  return { files, saved, csv };
}

describe('CSV import', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async (focusAreas: ('waist' | 'hips' | 'arms')[] = ['waist']) => {
    const fake = fakeFiles();
    const app = await createTestApp(
      fixedClock('2026-10-16T12:00:00.000Z', '2026-10-16'),
      undefined,
      fake.files,
    );
    dispose = app.dispose;
    const { id: profileId } = await app.handlers['profiles:create'](person);
    await app.handlers['tracking:accept']({
      profileId,
      answers: {
        project: null,
        focusAreas,
        weightDisplay: 'trend',
        interests: { menstrualCycle: null, progressPhotos: null, pin: null, weighingDevice: null },
        suggestion: null,
      },
    });
    return { ...app, ...fake, profileId };
  };

  it('previews weights, then imports only the ready rows', async () => {
    const { handlers, profileId, csv } = await setup();
    await handlers['weights:register']({
      profileId,
      measuredOn: '2026-10-05',
      measuredAt: '2026-10-05T07:10:00.000Z',
      weightKg: 92,
      tagIds: [],
      notes: null,
    });
    csv.text =
      'data;hora;peso_kg;observacao\n05/10/2026;07:10;92,0;\n06/10/2026;;91,6;viagem\n07/10/2026;07:00;9,1;\n';

    const preview = must(await handlers['import:preview']({ profileId, kind: 'weights' }));
    expect(preview.fileName).toBe('dados.csv');
    expect(preview.counts).toEqual({ ready: 1, duplicates: 1, errors: 1 });
    expect(preview.rows.map((r) => [r.line, r.status, r.code])).toEqual([
      [2, 'duplicate', null],
      [3, 'ready', null],
      [4, 'error', 'weight.out_of_range'],
    ]);
    expect(await handlers['weights:list']({ profileId })).toHaveLength(1); // nothing written yet

    expect(await handlers['import:confirm']({ profileId, token: preview.token })).toEqual({
      imported: 1,
    });
    const weights = await handlers['weights:list']({ profileId });
    expect(weights.map((w) => [w.measuredOn, w.measuredAt, w.weightKg, w.notes])).toContainEqual([
      '2026-10-06',
      '2026-10-06T12:00:00.000Z', // no time → noon
      91.6,
      'viagem',
    ]);
    // A preview is used once.
    await expect(handlers['import:confirm']({ profileId, token: preview.token })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('imports measurements and turns on columns the profile did not track', async () => {
    const { handlers, profileId, csv } = await setup(['waist']);
    csv.text = 'data;cintura;quadril\n05/10/2026;96;109\n12/10/2026;94,6;\n';

    const preview = must(await handlers['import:preview']({ profileId, kind: 'measurements' }));
    expect(preview.counts.ready).toBe(2);
    expect(preview.newMeasurementTypes).toEqual(['Quadril']);
    expect(preview.rows[0]?.values).toEqual([
      { name: 'Cintura', valueCm: 96 },
      { name: 'Quadril', valueCm: 109 },
    ]);

    await handlers['import:confirm']({ profileId, token: preview.token });
    const state = await handlers['tracking:get-state']({ profileId });
    expect(state.measurementTypes.map((t) => t.code)).toEqual(['waist', 'abdomen', 'hips']);
    const summary = await handlers['measurements:summary']({ profileId });
    expect(summary.items.find((i) => i.code === 'waist')?.change).toBe(-1.4);
  });

  it('refuses files with a file-level problem', async () => {
    const { handlers, profileId, csv } = await setup();
    csv.text = 'peso_kg\n92\n';
    const preview = must(await handlers['import:preview']({ profileId, kind: 'weights' }));
    expect(preview.fileError).toBe('import.missing_date_column');
    await expect(handlers['import:confirm']({ profileId, token: preview.token })).rejects.toThrow(
      ValidationError,
    );
  });

  it('writes nothing when part of the import fails', async () => {
    const { db, handlers, profileId, csv } = await setup();
    csv.text = 'data;peso_kg\n05/10/2026;92\n06/10/2026;91\n';
    const preview = must(await handlers['import:preview']({ profileId, kind: 'weights' }));
    // Simulate a failure in the middle of the transaction.
    await db.schema
      .createIndex('fail_second_row')
      .on('body_weights')
      .column('measured_on')
      .unique()
      .execute();
    await db
      .insertInto('body_weights')
      .values({
        id: '01900000-0000-7000-8000-00000000ffff',
        profile_id: profileId,
        measured_on: '2026-10-06',
        measured_at: '2026-10-06T07:00:00.000Z',
        weight_kg: 50,
        notes: null,
        created_at: 'x',
        updated_at: 'x',
        deleted_at: 'x',
      })
      .execute();
    await expect(handlers['import:confirm']({ profileId, token: preview.token })).rejects.toThrow();
    expect(await handlers['weights:list']({ profileId })).toEqual([]);
  });

  it('keeps previews private to the profile that created them', async () => {
    const { handlers, profileId, csv } = await setup();
    const other = await handlers['profiles:create']({ ...person, name: 'Ana' });
    csv.text = 'data;peso_kg\n05/10/2026;92\n';
    const preview = must(await handlers['import:preview']({ profileId, kind: 'weights' }));
    await expect(
      handlers['import:confirm']({ profileId: other.id, token: preview.token }),
    ).rejects.toThrow(NotFoundError);
    expect(await handlers['weights:list']({ profileId: other.id })).toEqual([]);
  });

  it('saves templates with the profile measurement columns', async () => {
    const { handlers, profileId, saved } = await setup(['waist', 'hips']);
    expect(await handlers['import:template']({ profileId, kind: 'measurements' })).toBe(true);
    expect(await handlers['import:template']({ profileId, kind: 'weights' })).toBe(true);
    expect(saved.map((s) => s.name)).toEqual(['medidas.csv', 'pesos.csv']);
    expect(saved[0]?.content).toContain('data;cintura;abdomen;quadril;observacao');
  });
});
