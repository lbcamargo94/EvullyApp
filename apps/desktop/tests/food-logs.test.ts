import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const rice = {
  name: 'Arroz branco cozido',
  brand: null,
  referenceAmount: 100,
  referenceUnit: 'g',
  caloriesKcal: 128,
  proteinG: 2.5,
  carbohydrateG: 28.1,
  fatG: 0.2,
  fiberG: 1.6,
  sodiumMg: 1,
  source: null,
} as const;
const chicken = {
  ...rice,
  name: 'Peito de frango grelhado',
  caloriesKcal: 165,
  proteinG: 31,
  carbohydrateG: 0,
  fatG: 3.6,
  fiberG: null,
  sodiumMg: null,
};
const person = { birthDate: null, sex: null, heightCm: null };

describe('food logs (README §9.4, §9.5)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-22T12:00:00.000Z', '2026-10-22'));
    dispose = app.dispose;
    const { handlers } = app;
    const lucas = await handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await handlers['profiles:create']({ ...person, name: 'Ana' });
    const riceFood = await handlers['foods:create'](rice);
    const chickenFood = await handlers['foods:create'](chicken);
    const lunch = (foodId: string, quantity: number, logDate = '2026-10-22') =>
      handlers['nutrition:add']({
        profileId: lucas.id,
        logDate,
        mealType: 'lunch',
        mealName: null,
        foodId,
        quantity,
      });
    return { ...app, lucas, ana, riceFood, chickenFood, lunch };
  };

  it('logs foods with nutrients for the quantity and totals for the day', async () => {
    const { lunch, riceFood, chickenFood } = await setup();
    await lunch(riceFood.id, 150);
    const day = await lunch(chickenFood.id, 200);
    expect(day.logs.map((l) => [l.foodName, l.quantity, l.nutrients.caloriesKcal])).toEqual([
      ['Arroz branco cozido', 150, 192],
      ['Peito de frango grelhado', 200, 330],
    ]);
    expect(day.totals.planned).toEqual({
      caloriesKcal: 522,
      proteinG: 65.8,
      carbohydrateG: 42.2,
      fatG: 7.5,
    });
    expect(day.totals.consumed.caloriesKcal).toBe(0);
  });

  it('keeps the copy: editing the food later does not change logged days', async () => {
    const { handlers, lucas, lunch, riceFood } = await setup();
    const [log] = (await lunch(riceFood.id, 100)).logs;
    await handlers['foods:update']({ ...rice, id: riceFood.id, name: 'Arroz', caloriesKcal: 200 });

    const day = await handlers['nutrition:update-quantity']({
      profileId: lucas.id,
      id: must(log).id,
      quantity: 50,
    });
    // Recalculated from the copy kept in the log (128 kcal/100 g), not from the edited food.
    expect(day.logs[0]).toMatchObject({ foodName: 'Arroz branco cozido', quantity: 50 });
    expect(day.logs[0]?.nutrients.caloriesKcal).toBe(64);
  });

  it('marks foods and whole meals as consumed, never in the future', async () => {
    const { handlers, lucas, lunch, riceFood, chickenFood } = await setup();
    await lunch(riceFood.id, 150);
    const [first] = (await lunch(chickenFood.id, 200)).logs;

    let day = await handlers['nutrition:set-consumed']({
      profileId: lucas.id,
      id: must(first).id,
      consumed: true,
    });
    expect(day.logs.map((l) => l.consumedAt !== null)).toEqual([true, false]);
    expect(day.totals.consumed.caloriesKcal).toBe(192);

    const meal = {
      profileId: lucas.id,
      date: '2026-10-22',
      mealType: 'lunch' as const,
      mealName: null,
    };
    day = await handlers['nutrition:set-meal-consumed']({ ...meal, consumed: true });
    expect(day.totals.consumed).toEqual(day.totals.planned);
    day = await handlers['nutrition:set-meal-consumed']({ ...meal, consumed: false });
    expect(day.totals.consumed.caloriesKcal).toBe(0);

    const tomorrow = (await lunch(riceFood.id, 100, '2026-10-23')).logs[0];
    await expect(
      handlers['nutrition:set-consumed']({
        profileId: lucas.id,
        id: must(tomorrow).id,
        consumed: true,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('keeps custom meals apart by name and removes logs', async () => {
    const { handlers, lucas, riceFood } = await setup();
    const add = (mealName: string) =>
      handlers['nutrition:add']({
        profileId: lucas.id,
        logDate: '2026-10-22',
        mealType: 'custom',
        mealName,
        foodId: riceFood.id,
        quantity: 100,
      });
    await add('Pós-treino');
    const day = await add('Lanche da tarde');
    await handlers['nutrition:set-meal-consumed']({
      profileId: lucas.id,
      date: '2026-10-22',
      mealType: 'custom',
      mealName: 'Pós-treino',
      consumed: true,
    });
    const after = await handlers['nutrition:day']({ profileId: lucas.id, date: '2026-10-22' });
    expect(after.logs.map((l) => [l.mealName, l.consumedAt !== null])).toEqual([
      ['Pós-treino', true],
      ['Lanche da tarde', false],
    ]);

    const removed = await handlers['nutrition:remove']({
      profileId: lucas.id,
      id: must(day.logs[0]).id,
    });
    expect(removed.logs).toHaveLength(1);
  });

  it('blocks removing a food that was logged', async () => {
    const { handlers, lunch, riceFood, chickenFood } = await setup();
    await lunch(riceFood.id, 100);
    await expect(handlers['foods:remove']({ id: riceFood.id })).rejects.toThrow(ConflictError);
    await expect(handlers['foods:remove']({ id: chickenFood.id })).resolves.toBeNull();
  });

  it('keeps each profile isolated', async () => {
    const { handlers, lucas, ana, lunch, riceFood } = await setup();
    const [log] = (await lunch(riceFood.id, 100)).logs;
    const anaDay = await handlers['nutrition:day']({ profileId: ana.id, date: '2026-10-22' });
    expect(anaDay.logs).toEqual([]);
    for (const action of [
      () => handlers['nutrition:remove']({ profileId: ana.id, id: must(log).id }),
      () =>
        handlers['nutrition:update-quantity']({ profileId: ana.id, id: must(log).id, quantity: 1 }),
      () =>
        handlers['nutrition:set-consumed']({ profileId: ana.id, id: must(log).id, consumed: true }),
    ]) {
      await expect(action()).rejects.toThrow(NotFoundError);
    }
    // Marking Ana's lunch never touches Lucas's.
    await handlers['nutrition:set-meal-consumed']({
      profileId: ana.id,
      date: '2026-10-22',
      mealType: 'lunch',
      mealName: null,
      consumed: true,
    });
    const lucasDay = await handlers['nutrition:day']({ profileId: lucas.id, date: '2026-10-22' });
    expect(lucasDay.logs[0]?.consumedAt).toBeNull();
  });

  it('rejects unknown foods and profiles', async () => {
    const { handlers, lucas, lunch } = await setup();
    await expect(lunch('01900000-0000-7000-8000-999999999999', 100)).rejects.toThrow(NotFoundError);
    await expect(
      handlers['nutrition:day']({
        profileId: '01900000-0000-7000-8000-999999999999',
        date: '2026-10-22',
      }),
    ).rejects.toThrow(NotFoundError);
    expect(lucas.id).toBeTruthy();
  });

  it('sums consumed logs per day with the target of each day (README §13.2)', async () => {
    const { handlers, lucas, ana, riceFood, chickenFood, lunch } = await setup();
    const [rice] = (await lunch(riceFood.id, 150, '2026-10-21')).logs;
    await lunch(chickenFood.id, 100); // planned only
    const [, chicken] = (await lunch(chickenFood.id, 200)).logs;
    await handlers['nutrition:set-consumed']({
      profileId: lucas.id,
      id: must(rice).id,
      consumed: true,
    });
    await handlers['nutrition:set-consumed']({
      profileId: lucas.id,
      id: must(chicken).id,
      consumed: true,
    });
    await handlers['nutrition-targets:set']({
      profileId: lucas.id,
      caloriesKcal: 2400,
      proteinG: 190,
      carbohydrateG: null,
      fatG: null,
      waterMl: null,
    });

    expect(await handlers['nutrition:history']({ profileId: lucas.id })).toEqual([
      {
        date: '2026-10-21',
        caloriesKcal: 192,
        proteinG: 3.8,
        targetCaloriesKcal: null,
        targetProteinG: null,
      },
      {
        date: '2026-10-22',
        caloriesKcal: 330,
        proteinG: 62,
        targetCaloriesKcal: 2400,
        targetProteinG: 190,
      },
    ]);
    expect(await handlers['nutrition:history']({ profileId: ana.id })).toEqual([]);
  });
});
