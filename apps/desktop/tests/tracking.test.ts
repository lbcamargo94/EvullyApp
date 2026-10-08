import type { TrackingAnswers } from '@evully/contracts';
import { ConflictError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers';

const shapeDePraia = {
  name: 'Shape de Praia',
  objective: 'fat_loss',
  startDate: '2026-10-05',
  targetDate: '2026-12-06',
} as const;

const answers = (overrides: Partial<TrackingAnswers> = {}): TrackingAnswers => ({
  project: shapeDePraia,
  focusAreas: ['waist', 'arms'],
  weightDisplay: 'trend',
  interests: { menstrualCycle: null, progressPhotos: 'later', pin: 'no', weighingDevice: 'phone' },
  suggestion: null,
  ...overrides,
});
const person = (name: string, sex: 'male' | 'female' | null = null) => ({
  name,
  birthDate: null,
  sex,
  heightCm: null,
});

describe('tracking questionnaire', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());
  const setup = async () => {
    const app = await createTestApp();
    dispose = app.dispose;
    return app;
  };

  it('has no tracking before onboarding', async () => {
    const { handlers } = await setup();
    const { id } = await handlers['profiles:create'](person('Lucas', 'male'));
    expect(await handlers['tracking:get-state']({ profileId: id })).toEqual({
      questionnaire: null,
      config: null,
      measurementTypes: [],
    });
  });

  it('accepting creates the project, config, measurements and tags together', async () => {
    const { db, handlers } = await setup();
    const { id } = await handlers['profiles:create'](person('Lucas', 'male'));
    const state = await handlers['tracking:accept']({ profileId: id, answers: answers() });

    expect(state.questionnaire).toBe('completed');
    expect(state.config).toMatchObject({
      effectiveFrom: '2026-10-07',
      weightDisplay: 'trend',
      focusAreas: ['waist', 'arms'],
      source: 'questionnaire',
      ruleVersion: 'tracking-rules@1',
    });
    expect(state.measurementTypes.map((m) => m.code)).toEqual([
      'waist',
      'abdomen',
      'right_arm',
      'left_arm',
    ]);
    expect(await handlers['projects:get-active']({ profileId: id })).toMatchObject({
      name: 'Shape de Praia',
      objective: 'fat_loss',
      status: 'active',
    });
    const tags = await db.selectFrom('tags').select('name').where('profile_id', '=', id).execute();
    expect(tags.map((t) => t.name)).not.toContain('Ciclo menstrual');
    expect(tags).toHaveLength(5);
  });

  it('skipping applies defaults without a project', async () => {
    const { handlers } = await setup();
    const { id } = await handlers['profiles:create'](person('Ana', 'female'));
    const state = await handlers['tracking:skip']({ profileId: id });
    expect(state.questionnaire).toBe('skipped');
    expect(state.config?.focusAreas).toEqual(['waist']);
    expect(state.measurementTypes.map((m) => m.code)).toEqual(['waist', 'abdomen']);
    expect(await handlers['projects:get-active']({ profileId: id })).toBeNull();
  });

  it('redoing keeps history, deactivates dropped measurements and uses the active objective', async () => {
    const { db, handlers } = await setup();
    const { id } = await handlers['profiles:create'](person('Lucas', 'male'));
    await handlers['tracking:accept']({
      profileId: id,
      answers: answers({
        project: { ...shapeDePraia, objective: 'muscle_gain' },
        focusAreas: ['legs'],
      }),
    });
    const state = await handlers['tracking:accept']({
      profileId: id,
      answers: answers({ project: null, focusAreas: ['arms'], weightDisplay: 'hidden' }),
    });

    expect(state.config?.weightDisplay).toBe('hidden');
    // Objective comes from the active project (muscle gain), so contracted biceps are included.
    expect(state.measurementTypes.map((m) => m.code)).toEqual([
      'right_arm',
      'left_arm',
      'right_biceps',
      'left_biceps',
    ]);
    expect(await db.selectFrom('tracking_configs').select('id').execute()).toHaveLength(2);
    const inactive = await db
      .selectFrom('profile_measurement_types')
      .select('id')
      .where('is_active', '=', 0)
      .execute();
    expect(inactive).toHaveLength(4);
  });

  it('rejects a second active project and writes nothing', async () => {
    const { db, handlers } = await setup();
    const { id } = await handlers['profiles:create'](person('Lucas'));
    await handlers['tracking:accept']({ profileId: id, answers: answers() });
    await expect(
      handlers['tracking:accept']({ profileId: id, answers: answers() }),
    ).rejects.toThrow(ConflictError);
    expect(await db.selectFrom('profile_questionnaires').select('id').execute()).toHaveLength(1);
  });

  it('rolls back everything when part of the setup fails', async () => {
    const { db, handlers } = await setup();
    const { id } = await handlers['profiles:create'](person('Lucas'));
    // Remove a catalog entry so the measurement step fails after earlier inserts.
    await db.deleteFrom('measurement_types').where('code', '=', 'right_arm').execute();
    await expect(
      handlers['tracking:accept']({ profileId: id, answers: answers() }),
    ).rejects.toThrow();
    for (const table of [
      'profile_questionnaires',
      'projects',
      'tracking_configs',
      'tags',
    ] as const) {
      expect(await db.selectFrom(table).select('id').execute()).toHaveLength(0);
    }
  });

  it('keeps each profile isolated', async () => {
    const { handlers } = await setup();
    const a = await handlers['profiles:create'](person('A'));
    const b = await handlers['profiles:create'](person('B', 'female'));
    await handlers['tracking:accept']({ profileId: a.id, answers: answers() });
    await handlers['tracking:accept']({
      profileId: b.id,
      answers: answers({
        project: { ...shapeDePraia, name: 'Verão', objective: 'recomposition' },
        focusAreas: ['hips'],
        weightDisplay: 'hidden',
      }),
    });

    const stateA = await handlers['tracking:get-state']({ profileId: a.id });
    const stateB = await handlers['tracking:get-state']({ profileId: b.id });
    expect(stateA.measurementTypes.map((m) => m.code)).toContain('right_arm');
    expect(stateB.measurementTypes.map((m) => m.code)).toEqual(['hips']);
    expect(stateB.config?.weightDisplay).toBe('hidden');
    expect((await handlers['projects:get-active']({ profileId: a.id }))?.name).toBe(
      'Shape de Praia',
    );
    expect((await handlers['projects:get-active']({ profileId: b.id }))?.name).toBe('Verão');
  });

  it('rejects an unknown profile', async () => {
    const { handlers } = await setup();
    await expect(
      handlers['tracking:skip']({ profileId: '01900000-0000-7000-8000-999999999999' }),
    ).rejects.toThrow('Profile not found');
  });
});
