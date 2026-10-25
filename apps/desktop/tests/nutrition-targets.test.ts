import { NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const targets = {
  caloriesKcal: 2400,
  proteinG: 190,
  carbohydrateG: null,
  fatG: null,
  waterMl: 3500,
};

describe('nutrition targets and water (README §9.4.1, §9.6, §9.9)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async (today = '2026-10-25') => {
    const app = await createTestApp(fixedClock(`${today}T12:00:00.000Z`, today));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    return { ...app, lucas, ana };
  };

  it('starts without targets: the app never fills them in', async () => {
    const { handlers, lucas } = await setup();
    expect(await handlers['nutrition-targets:current']({ profileId: lucas.id })).toBeNull();
    const day = await handlers['nutrition:day']({ profileId: lucas.id, date: '2026-10-25' });
    expect(day.target).toBeNull();
    expect(day.water).toEqual({ totalMl: 0, logs: [] });
  });

  it('sets targets from today and shows the one in force on each day', async () => {
    const { handlers, lucas } = await setup();
    const saved = await handlers['nutrition-targets:set']({ profileId: lucas.id, ...targets });
    expect(saved).toMatchObject({ ...targets, effectiveFrom: '2026-10-25' });
    await handlers['nutrition-targets:set']({
      profileId: lucas.id,
      ...targets,
      caloriesKcal: 2200,
    });

    expect(
      (await handlers['nutrition-targets:current']({ profileId: lucas.id }))?.caloriesKcal,
    ).toBe(2200);
    const today = await handlers['nutrition:day']({ profileId: lucas.id, date: '2026-10-25' });
    expect(today.target?.caloriesKcal).toBe(2200);
    const before = await handlers['nutrition:day']({ profileId: lucas.id, date: '2026-10-24' });
    expect(before.target).toBeNull();
    await expect(
      handlers['nutrition-targets:set']({ profileId: lucas.id, ...targets, caloriesKcal: 99_999 }),
    ).rejects.toThrow(ValidationError);
  });

  it('logs and removes water for the day', async () => {
    const { handlers, lucas } = await setup();
    await handlers['water:add']({ profileId: lucas.id, date: '2026-10-25', amountMl: 250 });
    const day = await handlers['water:add']({
      profileId: lucas.id,
      date: '2026-10-25',
      amountMl: 500,
    });
    expect(day.water.totalMl).toBe(750);
    const after = await handlers['water:remove']({
      profileId: lucas.id,
      id: must(day.water.logs[0]).id,
    });
    expect(after.water.totalMl).toBe(500);
    await expect(
      handlers['water:add']({ profileId: lucas.id, date: '2026-10-26', amountMl: 250 }),
    ).rejects.toThrow(ValidationError);
  });

  it('keeps targets and water isolated between profiles', async () => {
    const { handlers, lucas, ana } = await setup();
    await handlers['nutrition-targets:set']({ profileId: lucas.id, ...targets });
    const day = await handlers['water:add']({
      profileId: lucas.id,
      date: '2026-10-25',
      amountMl: 300,
    });
    expect(await handlers['nutrition-targets:current']({ profileId: ana.id })).toBeNull();
    const anaDay = await handlers['nutrition:day']({ profileId: ana.id, date: '2026-10-25' });
    expect(anaDay.water.totalMl).toBe(0);
    await expect(
      handlers['water:remove']({ profileId: ana.id, id: must(day.water.logs[0]).id }),
    ).rejects.toThrow(NotFoundError);
  });
});
