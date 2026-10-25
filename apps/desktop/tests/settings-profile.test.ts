import { NotFoundError, ValidationError } from '@evully/domain';
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { name: 'Lucas', birthDate: null, sex: null, heightCm: null };

const PROFILE_TABLES = [
  'projects',
  'profile_questionnaires',
  'tracking_configs',
  'profile_measurement_types',
  'tags',
  'body_weights',
  'body_measurements',
  'food_logs',
  'meal_templates',
  'nutrition_targets',
  'water_logs',
] as const;

describe('settings: profiles, theme and legal documents', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-20T12:00:00.000Z', '2026-10-20'));
    dispose = app.dispose;
    const { handlers } = app;
    const lucas = await handlers['profiles:create'](person);
    const ana = await handlers['profiles:create']({ ...person, name: 'Ana' });
    // Household catalog: it stays when a profile is deleted (README §6.1).
    const food = await handlers['foods:create']({
      name: 'Arroz',
      brand: null,
      referenceAmount: 100,
      referenceUnit: 'g',
      caloriesKcal: 128,
      proteinG: 2.5,
      carbohydrateG: 28,
      fatG: 0.2,
      fiberG: null,
      sodiumMg: null,
      source: null,
    });
    for (const profileId of [lucas.id, ana.id]) {
      await handlers['tracking:accept']({
        profileId,
        answers: {
          project: {
            name: 'Projeto',
            objective: 'fat_loss',
            startDate: '2026-10-01',
            targetDate: '2026-12-01',
          },
          focusAreas: ['waist'],
          weightDisplay: 'trend',
          interests: {
            menstrualCycle: null,
            progressPhotos: null,
            pin: null,
            weighingDevice: null,
          },
          suggestion: null,
        },
      });
      const [tag] = await handlers['tags:list']({ profileId });
      await handlers['weights:register']({
        profileId,
        measuredOn: '2026-10-20',
        measuredAt: '2026-10-20T07:00:00.000Z',
        weightKg: 80,
        tagIds: [must(tag).id],
        notes: null,
      });
      const lunch = { mealType: 'lunch', mealName: null } as const;
      await handlers['nutrition:add']({
        profileId,
        logDate: '2026-10-20',
        ...lunch,
        foodId: food.id,
        quantity: 150,
      });
      await handlers['meal-templates:save']({
        profileId,
        date: '2026-10-20',
        ...lunch,
        name: 'Almoço',
      });
      await handlers['nutrition-targets:set']({
        profileId,
        caloriesKcal: 2000,
        proteinG: 120,
        carbohydrateG: null,
        fatG: null,
        waterMl: 2500,
      });
      await handlers['water:add']({ profileId, date: '2026-10-20', amountMl: 250 });
    }
    return { ...app, lucas, ana, food };
  };

  const countRows = async (db: Awaited<ReturnType<typeof setup>>['db'], profileId: string) => {
    let total = 0;
    for (const table of PROFILE_TABLES) {
      const rows = await db
        .selectFrom(table)
        .select('id')
        .where('profile_id', '=', profileId)
        .execute();
      total += rows.length;
    }
    return total;
  };

  it('archives and restores a profile without losing data', async () => {
    const { db, handlers, lucas } = await setup();
    const before = await countRows(db, lucas.id);

    expect(await handlers['profiles:archive']({ id: lucas.id })).toBeNull();
    expect((await handlers['profiles:list'](undefined)).map((p) => p.name)).toEqual(['Ana']);
    expect(await handlers['profiles:list-archived'](undefined)).toEqual([
      { id: lucas.id, name: 'Lucas', archivedAt: '2026-10-20T12:00:00.000Z' },
    ]);
    await expect(handlers['profiles:get']({ id: lucas.id })).rejects.toThrow(NotFoundError);

    expect(await handlers['profiles:restore']({ id: lucas.id })).toEqual({
      id: lucas.id,
      name: 'Lucas',
    });
    expect(await handlers['profiles:list-archived'](undefined)).toEqual([]);
    expect(await countRows(db, lucas.id)).toBe(before);
    expect(await handlers['weights:list']({ profileId: lucas.id })).toHaveLength(1);
  });

  it('rejects archiving or restoring unknown or wrong-state profiles', async () => {
    const { handlers, lucas } = await setup();
    await expect(handlers['profiles:restore']({ id: lucas.id })).rejects.toThrow(NotFoundError);
    await handlers['profiles:archive']({ id: lucas.id });
    await expect(handlers['profiles:archive']({ id: lucas.id })).rejects.toThrow(NotFoundError);
  });

  it('deletes only archived profiles, with the typed name, after a backup', async () => {
    const { db, dir, handlers, lucas, ana } = await setup();
    const anaRows = await countRows(db, ana.id);

    // Active profiles cannot be deleted.
    await expect(
      handlers['profiles:delete-permanently']({ id: lucas.id, confirmName: 'Lucas' }),
    ).rejects.toThrow(NotFoundError);

    await handlers['profiles:archive']({ id: lucas.id });
    await expect(
      handlers['profiles:delete-permanently']({ id: lucas.id, confirmName: 'Luc' }),
    ).rejects.toThrow(ValidationError);
    expect(readdirSync(dir)).not.toContain('backups'); // no backup for a rejected request

    expect(
      await handlers['profiles:delete-permanently']({ id: lucas.id, confirmName: ' lucas ' }),
    ).toBeNull();

    expect(await handlers['profiles:list-archived'](undefined)).toEqual([]);
    expect(await db.selectFrom('profiles').select('id').execute()).toEqual([{ id: ana.id }]);
    expect(await countRows(db, lucas.id)).toBe(0);
    expect(await db.selectFrom('meal_template_items').select('id').execute()).toHaveLength(1); // Ana's
    expect(await handlers['foods:list'](undefined)).toHaveLength(1); // the catalog stays
    expect(await db.selectFrom('body_weight_tags').select('body_weight_id').execute()).toHaveLength(
      1,
    ); // Ana's only
    expect(await countRows(db, ana.id)).toBe(anaRows);

    expect(readdirSync(join(dir, 'backups'))).toHaveLength(1);
    expect((await handlers['backup:status'](undefined)).lastBackup?.kind).toBe('pre-delete');
  });

  it('keeps everything when the backup before deletion fails', async () => {
    const { db, dir, handlers, lucas } = await setup();
    await handlers['profiles:archive']({ id: lucas.id });
    const before = await countRows(db, lucas.id);
    writeFileSync(join(dir, 'backups'), 'not a folder'); // the backup folder cannot be created

    await expect(
      handlers['profiles:delete-permanently']({ id: lucas.id, confirmName: 'Lucas' }),
    ).rejects.toThrow();
    expect(await countRows(db, lucas.id)).toBe(before);
    expect(await handlers['profiles:list-archived'](undefined)).toHaveLength(1);
  });

  it('stores the theme and falls back per setting on corrupted values', async () => {
    const { db, handlers } = await setup();
    expect((await handlers['settings:get'](undefined)).theme).toBe('system');

    const updated = await handlers['settings:update']({ theme: 'dark' });
    expect(updated).toMatchObject({ theme: 'dark', inactivityLockMinutes: 15 });
    await handlers['settings:update']({ inactivityLockMinutes: 5 });
    await handlers['settings:accept-health-notice'](undefined);

    await db
      .updateTable('settings')
      .set({ value: JSON.stringify('purple') })
      .where('key', '=', 'theme')
      .execute();
    const settings = await handlers['settings:get'](undefined);
    expect(settings.theme).toBe('system');
    expect(settings.inactivityLockMinutes).toBe(5);
    expect(settings.healthNoticeAcceptedAt).not.toBeNull();
  });

  it('serves the legal documents', async () => {
    const { handlers } = await setup();
    expect(await handlers['app:legal'](undefined)).toEqual({
      license: 'LICENSE',
      thirdPartyNotices: 'NOTICES',
    });
  });
});
