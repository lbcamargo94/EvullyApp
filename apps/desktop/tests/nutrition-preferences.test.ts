import { ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };

describe('nutrition module questionnaire (README §9)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-25T12:00:00.000Z', '2026-10-25'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    return { ...app, lucas, ana };
  };

  it('is pending with defaults until answered', async () => {
    const { handlers, lucas } = await setup();
    expect(await handlers['nutrition-preferences:get']({ profileId: lucas.id })).toEqual({
      status: 'pending',
      meals: ['breakfast', 'morning_snack', 'lunch', 'pre_workout', 'dinner', 'supper'],
      trackWater: true,
      restrictions: null,
    });
  });

  it('saves answers as history; the latest wins, and the tracking questionnaire is untouched', async () => {
    const { db, handlers, lucas } = await setup();
    await handlers['nutrition-preferences:answer']({
      profileId: lucas.id,
      meals: ['lunch', 'breakfast', 'dinner'],
      trackWater: false,
      restrictions: ' sem lactose ',
    });
    const latest = await handlers['nutrition-preferences:answer']({
      profileId: lucas.id,
      meals: ['breakfast', 'lunch', 'dinner', 'supper'],
      trackWater: true,
      restrictions: null,
    });
    expect(latest).toEqual({
      status: 'completed',
      meals: ['breakfast', 'lunch', 'dinner', 'supper'],
      trackWater: true,
      restrictions: null,
    });
    const rows = await db
      .selectFrom('profile_questionnaires')
      .select(['questionnaire_code', 'questionnaire_version'])
      .execute();
    expect(rows).toEqual([
      { questionnaire_code: 'nutrition', questionnaire_version: 'nutrition@1' },
      { questionnaire_code: 'nutrition', questionnaire_version: 'nutrition@1' },
    ]);
    // The tracking questionnaire (V0.1) still counts as not answered.
    expect(
      (await handlers['tracking:get-state']({ profileId: lucas.id })).questionnaire,
    ).toBeNull();
  });

  it('skipping keeps the defaults and is not asked again', async () => {
    const { handlers, lucas } = await setup();
    expect(await handlers['nutrition-preferences:skip']({ profileId: lucas.id })).toMatchObject({
      status: 'skipped',
      trackWater: true,
    });
    expect((await handlers['nutrition-preferences:get']({ profileId: lucas.id })).status).toBe(
      'skipped',
    );
  });

  it('requires a meal and keeps profiles isolated', async () => {
    const { handlers, lucas, ana } = await setup();
    await expect(
      handlers['nutrition-preferences:answer']({
        profileId: lucas.id,
        meals: [],
        trackWater: true,
        restrictions: null,
      }),
    ).rejects.toThrow(ValidationError);
    await handlers['nutrition-preferences:answer']({
      profileId: lucas.id,
      meals: ['lunch'],
      trackWater: false,
      restrictions: null,
    });
    expect((await handlers['nutrition-preferences:get']({ profileId: ana.id })).status).toBe(
      'pending',
    );
  });
});
