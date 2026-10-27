import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };

describe('habits (README §11.2)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-26T12:00:00.000Z', '2026-10-26'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    return { ...app, lucas, ana };
  };

  it('adds the examples once and keeps their order', async () => {
    const { handlers, lucas } = await setup();
    await handlers['habits:create']({
      profileId: lucas.id,
      name: 'passos',
      type: 'quantity',
      unit: null,
      targetValue: null,
    });
    const habits = await handlers['habits:add-examples']({ profileId: lucas.id });
    expect(habits.map((h) => h.name)).toEqual(['passos', 'Creatina']);
    const again = await handlers['habits:add-examples']({ profileId: lucas.id });
    expect(again).toHaveLength(2);
    const moved = await handlers['habits:move']({
      profileId: lucas.id,
      id: must(habits[1]).id,
      direction: 'up',
    });
    expect(moved.map((h) => h.name)).toEqual(['Creatina', 'passos']);
  });

  it('logs one value per habit per day, with done and the last 7 days', async () => {
    const { handlers, lucas } = await setup();
    const steps = await handlers['habits:create']({
      profileId: lucas.id,
      name: 'Passos',
      type: 'quantity',
      unit: 'passos',
      targetValue: 8000,
    });
    const log = (date: string, value: number | null) =>
      handlers['habits:log']({ profileId: lucas.id, habitId: steps.id, date, value });
    await log('2026-10-24', 9000);
    await log('2026-10-26', 5000);
    let day = await log('2026-10-26', 8500); // replaces the value
    expect(day.habits[0]).toMatchObject({ value: 8500, done: true });
    expect(day.habits[0]?.last7).toEqual([false, false, false, false, true, false, true]);

    day = await log('2026-10-26', null); // clears the day
    expect(day.habits[0]).toMatchObject({ value: null, done: false });
    await expect(log('2026-10-27', 100)).rejects.toThrow(ValidationError);
  });

  it('edits, validates and deactivates habits keeping their logs', async () => {
    const { db, handlers, lucas } = await setup();
    const creatine = await handlers['habits:create']({
      profileId: lucas.id,
      name: 'Creatina',
      type: 'boolean',
      unit: null,
      targetValue: null,
    });
    await expect(
      handlers['habits:create']({
        profileId: lucas.id,
        name: 'CREATINA',
        type: 'boolean',
        unit: null,
        targetValue: null,
      }),
    ).rejects.toThrow(ConflictError);
    await handlers['habits:log']({
      profileId: lucas.id,
      habitId: creatine.id,
      date: '2026-10-26',
      value: 1,
    });
    await expect(
      handlers['habits:log']({
        profileId: lucas.id,
        habitId: creatine.id,
        date: '2026-10-26',
        value: 2,
      }),
    ).rejects.toThrow(ValidationError);

    const edited = await handlers['habits:update']({
      profileId: lucas.id,
      id: creatine.id,
      name: 'Creatina 5 g',
      type: 'boolean',
      unit: null,
      targetValue: null,
    });
    expect(edited.name).toBe('Creatina 5 g');
    await handlers['habits:deactivate']({ profileId: lucas.id, id: creatine.id });
    expect(await handlers['habits:list']({ profileId: lucas.id })).toEqual([]);
    expect(await db.selectFrom('habit_logs').select('value').execute()).toEqual([{ value: 1 }]);
  });

  it('keeps habits isolated between profiles', async () => {
    const { handlers, lucas, ana } = await setup();
    const habit = await handlers['habits:create']({
      profileId: lucas.id,
      name: 'Creatina',
      type: 'boolean',
      unit: null,
      targetValue: null,
    });
    expect(
      (await handlers['habits:day']({ profileId: ana.id, date: '2026-10-26' })).habits,
    ).toEqual([]);
    for (const action of [
      () =>
        handlers['habits:log']({
          profileId: ana.id,
          habitId: habit.id,
          date: '2026-10-26',
          value: 1,
        }),
      () => handlers['habits:deactivate']({ profileId: ana.id, id: habit.id }),
      () =>
        handlers['habits:update']({
          profileId: ana.id,
          id: habit.id,
          name: 'X',
          type: 'boolean',
          unit: null,
          targetValue: null,
        }),
    ]) {
      await expect(action()).rejects.toThrow(NotFoundError);
    }
    // The same name is fine for another profile.
    await expect(
      handlers['habits:create']({
        profileId: ana.id,
        name: 'Creatina',
        type: 'boolean',
        unit: null,
        targetValue: null,
      }),
    ).resolves.toMatchObject({ name: 'Creatina' });
  });
});
