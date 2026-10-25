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
  fiberG: null,
  sodiumMg: null,
  source: null,
} as const;
const person = { birthDate: null, sex: null, heightCm: null };
const lunch = { mealType: 'lunch', mealName: null } as const;

describe('meal shortcuts (README §9.5)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-25T12:00:00.000Z', '2026-10-25'));
    dispose = app.dispose;
    const { handlers } = app;
    const lucas = await handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await handlers['profiles:create']({ ...person, name: 'Ana' });
    const food = await handlers['foods:create'](rice);
    const beans = await handlers['foods:create']({ ...rice, name: 'Feijão', caloriesKcal: 76 });
    const add = (foodId: string, quantity: number, logDate: string) =>
      handlers['nutrition:add']({ profileId: lucas.id, logDate, ...lunch, foodId, quantity });
    // Yesterday's lunch, eaten.
    await add(food.id, 150, '2026-10-24');
    await add(beans.id, 100, '2026-10-24');
    await handlers['nutrition:set-meal-consumed']({
      profileId: lucas.id,
      date: '2026-10-24',
      ...lunch,
      consumed: true,
    });
    return { ...app, lucas, ana, food, beans };
  };

  it('repeats yesterday as planned, keeping the values of the source', async () => {
    const { handlers, lucas, food } = await setup();
    await handlers['foods:update']({ ...rice, id: food.id, caloriesKcal: 999 });
    const day = await handlers['nutrition:copy-meal']({
      profileId: lucas.id,
      from: { date: '2026-10-24', ...lunch },
      to: { date: '2026-10-25', ...lunch },
    });
    expect(day.date).toBe('2026-10-25');
    expect(day.logs.map((l) => [l.foodName, l.quantity, l.nutrients.caloriesKcal])).toEqual([
      ['Arroz branco cozido', 150, 192],
      ['Feijão', 100, 76],
    ]);
    expect(day.logs.every((l) => l.consumedAt === null)).toBe(true);
  });

  it('copies to another meal and day, within the planning limit', async () => {
    const { handlers, lucas } = await setup();
    const day = await handlers['nutrition:copy-meal']({
      profileId: lucas.id,
      from: { date: '2026-10-24', ...lunch },
      to: { date: '2026-10-26', mealType: 'custom', mealName: 'Marmita' },
    });
    expect(day.logs.map((l) => l.mealName)).toEqual(['Marmita', 'Marmita']);
    await expect(
      handlers['nutrition:copy-meal']({
        profileId: lucas.id,
        from: { date: '2026-10-24', ...lunch },
        to: { date: '2026-12-31', ...lunch },
      }),
    ).rejects.toThrow(ValidationError);
    await expect(
      handlers['nutrition:copy-meal']({
        profileId: lucas.id,
        from: { date: '2026-10-20', ...lunch }, // empty
        to: { date: '2026-10-25', ...lunch },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('saves a favorite and applies it with the current food values', async () => {
    const { handlers, lucas, food } = await setup();
    const saved = await handlers['meal-templates:save']({
      profileId: lucas.id,
      date: '2026-10-24',
      ...lunch,
      name: ' Almoço  padrão ',
    });
    expect(saved).toMatchObject({ name: 'Almoço padrão', caloriesKcal: 268 });
    expect(saved.items.map((i) => [i.foodName, i.quantity])).toEqual([
      ['Arroz branco cozido', 150],
      ['Feijão', 100],
    ]);
    await expect(
      handlers['meal-templates:save']({
        profileId: lucas.id,
        date: '2026-10-24',
        ...lunch,
        name: 'ALMOÇO PADRÃO',
      }),
    ).rejects.toThrow(ConflictError);

    await handlers['foods:update']({ ...rice, id: food.id, caloriesKcal: 130 });
    const day = await handlers['meal-templates:apply']({
      profileId: lucas.id,
      templateId: saved.id,
      date: '2026-10-25',
      mealType: 'dinner',
      mealName: null,
    });
    expect(day.logs.map((l) => [l.mealType, l.nutrients.caloriesKcal, l.consumedAt])).toEqual([
      ['dinner', 195, null],
      ['dinner', 76, null],
    ]);

    // A food kept in a favorite cannot be removed from the catalog.
    await expect(handlers['foods:remove']({ id: food.id })).rejects.toThrow(ConflictError);
    expect(
      await handlers['meal-templates:remove']({ profileId: lucas.id, id: saved.id }),
    ).toBeNull();
    expect(await handlers['meal-templates:list']({ profileId: lucas.id })).toEqual([]);
  });

  it('keeps favorites and meals isolated between profiles', async () => {
    const { handlers, lucas, ana } = await setup();
    const saved = await handlers['meal-templates:save']({
      profileId: lucas.id,
      date: '2026-10-24',
      ...lunch,
      name: 'Almoço',
    });
    expect(await handlers['meal-templates:list']({ profileId: ana.id })).toEqual([]);
    await expect(
      handlers['meal-templates:apply']({
        profileId: ana.id,
        templateId: saved.id,
        date: '2026-10-25',
        ...lunch,
      }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      handlers['meal-templates:remove']({ profileId: ana.id, id: saved.id }),
    ).rejects.toThrow(NotFoundError);
    // Ana has no lunch yesterday: nothing to copy from Lucas.
    await expect(
      handlers['nutrition:copy-meal']({
        profileId: ana.id,
        from: { date: '2026-10-24', ...lunch },
        to: { date: '2026-10-25', ...lunch },
      }),
    ).rejects.toThrow(ValidationError);
    expect(must(await handlers['meal-templates:list']({ profileId: lucas.id }))).toHaveLength(1);
  });
});
