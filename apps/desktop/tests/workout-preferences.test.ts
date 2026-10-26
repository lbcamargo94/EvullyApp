import { ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const answers = {
  experience: 'intermediate' as const,
  daysPerWeek: 5,
  location: 'gym' as const,
  equipment: ['machines' as const, 'barbell' as const],
};

describe('workouts module questionnaire (README §10)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-26T12:00:00.000Z', '2026-10-26'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    return { ...app, lucas, ana };
  };

  it('is pending without suggestions until answered', async () => {
    const { handlers, lucas } = await setup();
    expect(await handlers['workout-preferences:get']({ profileId: lucas.id })).toMatchObject({
      status: 'pending',
      suggestions: { templates: [], buildOwnPlan: false },
    });
  });

  it('saves answers as history and suggests templates without importing them', async () => {
    const { db, handlers, lucas } = await setup();
    await handlers['workout-preferences:answer']({
      profileId: lucas.id,
      ...answers,
      daysPerWeek: 3,
    });
    const latest = await handlers['workout-preferences:answer']({
      profileId: lucas.id,
      ...answers,
      equipment: [...answers.equipment],
    });
    expect(latest).toMatchObject({
      status: 'completed',
      equipment: ['barbell', 'machines'],
      suggestions: {
        rulesVersion: 'workout-rules@1',
        templates: [
          { template: 'cutting_2026', reason: 'gym_five_days' },
          { template: 'core_home', reason: 'core_complement' },
        ],
        buildOwnPlan: false,
      },
    });
    const rows = await db
      .selectFrom('profile_questionnaires')
      .select('questionnaire_version')
      .where('questionnaire_code', '=', 'workouts')
      .execute();
    expect(rows).toHaveLength(2);
    expect(rows[0]?.questionnaire_version).toBe('workouts@1');
    expect(await handlers['workout-plans:list']({ profileId: lucas.id })).toEqual([]);
  });

  it('can be skipped and validates the days', async () => {
    const { handlers, lucas } = await setup();
    await expect(
      handlers['workout-preferences:answer']({
        profileId: lucas.id,
        ...answers,
        equipment: [],
        daysPerWeek: 9,
      }),
    ).rejects.toThrow(ValidationError);
    expect(await handlers['workout-preferences:skip']({ profileId: lucas.id })).toMatchObject({
      status: 'skipped',
      suggestions: { templates: [] },
    });
  });

  it('keeps answers isolated and does not touch the nutrition questionnaire', async () => {
    const { handlers, lucas, ana } = await setup();
    await handlers['workout-preferences:answer']({
      profileId: lucas.id,
      ...answers,
      equipment: [],
    });
    expect((await handlers['workout-preferences:get']({ profileId: ana.id })).status).toBe(
      'pending',
    );
    expect((await handlers['nutrition-preferences:get']({ profileId: lucas.id })).status).toBe(
      'pending',
    );
  });
});
