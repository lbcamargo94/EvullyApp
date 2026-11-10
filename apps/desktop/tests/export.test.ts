import { parseCsv, parseLocalDate } from '@evully/domain';
import { sql } from 'kysely';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { seedClock, seedDemo } from '../seed/demo-seed';
import type { ProfileExportDocument } from '../src/modules/exports/application/export-profile';
import {
  CHILD_EXPORT_TABLES,
  PROFILE_EXPORT_TABLES,
  SHARED_EXPORT_TABLES,
  type ExportFiles,
} from '../src/modules/exports/ports/export-ports';
import { createTestApp, noDialogs, noImportFiles, must } from './helpers';

const today = parseLocalDate('2026-11-03');

/** Save dialog that accepts the suggested name and keeps what would be written. */
function capturingFiles() {
  const saved: { name?: string; json?: string; zip?: Record<string, string> } = {};
  const files: ExportFiles = {
    saveJson: async (name, content) => {
      Object.assign(saved, { name, json: content });
      return name;
    },
    saveZip: async (name, content) => {
      Object.assign(saved, { name, zip: content });
      return name;
    },
  };
  return { saved, files };
}

async function seededApp(files: ExportFiles, csvToImport?: () => string) {
  const clock = seedClock(today);
  const importFiles = csvToImport
    ? { ...noImportFiles, chooseCsv: async () => ({ fileName: 'x.csv', text: csvToImport() }) }
    : noImportFiles;
  const app = await createTestApp(clock, noDialogs, importFiles, undefined, files);
  const { handlers } = app;
  const ana = await handlers['profiles:create']({
    name: 'Ana',
    birthDate: null,
    sex: null,
    heightCm: null,
  });
  const anaWeight = await handlers['weights:register']({
    profileId: ana.id,
    measuredOn: today,
    measuredAt: clock.localToIso(today, '08:00'),
    weightKg: 61.2,
    tagIds: [],
    notes: null,
  });
  const demo = await seedDemo(handlers, clock, today);
  return { app, handlers, ana, anaWeight, demo };
}

describe('profile export (README §14.3)', () => {
  const { saved, files } = capturingFiles();
  let csv = '';
  let seeded: Awaited<ReturnType<typeof seededApp>>;
  beforeAll(async () => {
    seeded = await seededApp(files, () => csv);
  }, 120_000);
  afterAll(() => seeded.app.dispose());

  it('exports every table of the current profile only, as JSON', async () => {
    const { handlers, anaWeight, demo } = seeded;
    const profileId = demo.profileId;

    const result = await handlers['exports:create']({ profileId, format: 'json' });
    expect(result).toEqual({ fileName: 'evully-dados-demo-2026-11-03.json' });
    const doc = JSON.parse(must(saved.json, 'json')) as ProfileExportDocument;

    expect(doc).toMatchObject({
      format: 'evully-profile-export',
      formatVersion: 1,
      appVersion: '0.0.0-test',
      profile: { id: profileId },
    });
    expect(doc.schemaVersion).toMatch(/^\d{4}_/);
    expect(doc.data.body_weights).toHaveLength(demo.weights);
    expect(doc.data.workout_sessions).toHaveLength(demo.workouts);
    expect(doc.data.sleep_logs).toHaveLength(demo.nights);
    expect(doc.data.habit_logs.length).toBeGreaterThan(0);
    expect(doc.data.water_logs.length).toBeGreaterThan(0);

    // Isolation: no row of another profile; system exercises have no profile.
    for (const table of PROFILE_EXPORT_TABLES) {
      for (const row of doc.data[table] as { profile_id: string | null }[]) {
        expect([profileId, ...(table === 'exercises' ? [null] : [])]).toContain(row.profile_id);
      }
    }
    expect(JSON.stringify(doc)).not.toContain(anaWeight.id);

    // Shared catalogs: every referenced food and exercise is in the file.
    const foodIds = new Set(doc.data.foods.map((f) => f.id));
    expect(doc.data.food_logs.every((l) => foodIds.has(l.food_id))).toBe(true);
    const exerciseIds = new Set(doc.data.exercises.map((e) => e.id));
    expect(doc.data.exercise_performances.every((p) => exerciseIds.has(p.exercise_id))).toBe(true);
  });

  it('classifies every table of the database (new tables must be added to the export)', async () => {
    const { rows } = await sql<{ name: string }>`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'kysely_%'
    `.execute(seeded.app.db);
    const known = new Set<string>([
      'profiles',
      ...PROFILE_EXPORT_TABLES,
      ...CHILD_EXPORT_TABLES,
      ...SHARED_EXPORT_TABLES,
    ]);
    expect(rows.map((r) => r.name).filter((name) => !known.has(name))).toEqual([]);
  });

  it('writes the CSV zip; weights.csv and measurements.csv import back', async () => {
    const { handlers, ana, demo } = seeded;

    const result = await handlers['exports:create']({ profileId: demo.profileId, format: 'csv' });
    expect(result).toEqual({ fileName: 'evully-csv-demo-2026-11-03.zip' });
    const zip = must(saved.zip, 'zip');
    expect(Object.keys(zip).sort()).toEqual([
      'cardio.csv',
      'exercise_sets.csv',
      'habits.csv',
      'measurements.csv',
      'nutrition.csv',
      'sleep.csv',
      'water.csv',
      'weights.csv',
      'workouts.csv',
    ]);
    const weights = parseCsv(must(zip['weights.csv'], 'weights'));
    expect(weights.delimiter).toBe(';');
    expect(weights.header).toEqual(['data', 'hora', 'peso_kg', 'observacao']);
    expect(weights.rows).toHaveLength(demo.weights);
    expect(parseCsv(must(zip['workouts.csv'], 'workouts')).rows).toHaveLength(demo.workouts);
    expect(parseCsv(must(zip['sleep.csv'], 'sleep')).rows).toHaveLength(demo.nights);
    expect(zip['nutrition.csv']).not.toContain('Ana');

    csv = must(zip['weights.csv'], 'weights');
    const weightPreview = await handlers['import:preview']({ profileId: ana.id, kind: 'weights' });
    expect(weightPreview?.fileError).toBeNull();
    expect(weightPreview?.counts.errors).toBe(0);
    expect(weightPreview?.counts.ready).toBe(demo.weights);

    csv = must(zip['measurements.csv'], 'measurements');
    const measurePreview = await handlers['import:preview']({
      profileId: ana.id,
      kind: 'measurements',
    });
    expect(measurePreview?.fileError).toBeNull();
    expect(measurePreview?.counts).toMatchObject({ ready: 9, errors: 0 });
  });

  it('leaves deleted rows out but keeps deleted rows that kept rows point to', async () => {
    const { handlers, demo } = seeded;
    const profileId = demo.profileId;
    const [weight] = await handlers['weights:list']({ profileId });
    await handlers['weights:delete']({ profileId, id: must(weight, 'weight').id });
    const discarded = await handlers['workout-sessions:start']({ profileId, workoutDayId: null });
    await handlers['workout-sessions:discard']({ profileId, id: discarded.id });
    const stats = await handlers['workout-stats:get']({ profileId });
    const usedDay = must(stats.at(-1)?.dayId, 'day');
    await handlers['workout-days:remove']({ profileId, id: usedDay });

    await handlers['exports:create']({ profileId, format: 'json' });
    const doc = JSON.parse(must(saved.json, 'json')) as ProfileExportDocument;
    expect(doc.data.body_weights.map((w) => w.id)).not.toContain(weight?.id);
    expect(doc.data.body_weights).toHaveLength(demo.weights - 1);
    expect(doc.data.workout_sessions.map((s) => s.id)).not.toContain(discarded.id);
    const day = doc.data.workout_days.find((d) => d.id === usedDay);
    expect(day?.deleted_at).not.toBeNull();
  });
});

describe('profile export without a save', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  it('returns null when the save dialog is cancelled and refuses unknown profiles', async () => {
    const app = await createTestApp();
    dispose = app.dispose;
    const { handlers } = app;
    const profile = await handlers['profiles:create']({
      name: 'Bia',
      birthDate: null,
      sex: null,
      heightCm: null,
    });
    expect(await handlers['exports:create']({ profileId: profile.id, format: 'csv' })).toBeNull();
    await expect(
      handlers['exports:create']({
        profileId: '01900000-0000-7000-8000-00000000ffff',
        format: 'json',
      }),
    ).rejects.toThrow('Profile not found');
  });
});
