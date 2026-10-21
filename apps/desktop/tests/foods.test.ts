import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock } from './helpers';

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
  source: 'TACO',
} as const;

describe('foods (README §9.2)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-21T12:00:00.000Z', '2026-10-21'));
    dispose = app.dispose;
    return app;
  };

  it('creates, lists by name, updates and removes foods', async () => {
    const { handlers } = await setup();
    const created = await handlers['foods:create']({ ...rice, name: '  Arroz   branco cozido ' });
    expect(created).toMatchObject({ ...rice, createdAt: '2026-10-21T12:00:00.000Z' });
    await handlers['foods:create']({ ...rice, name: 'Abacate', caloriesKcal: 96, source: null });
    expect((await handlers['foods:list'](undefined)).map((f) => f.name)).toEqual([
      'Abacate',
      'Arroz branco cozido',
    ]);

    const updated = await handlers['foods:update']({ ...rice, id: created.id, caloriesKcal: 130 });
    expect(updated.caloriesKcal).toBe(130);

    expect(await handlers['foods:remove']({ id: created.id })).toBeNull();
    expect((await handlers['foods:list'](undefined)).map((f) => f.name)).toEqual(['Abacate']);
    await expect(handlers['foods:remove']({ id: created.id })).rejects.toThrow(NotFoundError);
    await expect(handlers['foods:update']({ ...rice, id: created.id })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('keeps one food per name and brand, but a removed one can be added again', async () => {
    const { handlers } = await setup();
    const first = await handlers['foods:create'](rice);
    await expect(
      handlers['foods:create']({ ...rice, name: 'ARROZ BRANCO COZIDO' }),
    ).rejects.toThrow(ConflictError);
    await handlers['foods:create']({ ...rice, brand: 'Tio João' });

    const other = await handlers['foods:create']({ ...rice, name: 'Feijão' });
    await expect(
      handlers['foods:update']({ ...rice, id: other.id }), // renaming onto an existing food
    ).rejects.toThrow(ConflictError);
    await handlers['foods:update']({ ...rice, id: first.id, name: 'arroz branco cozido' });

    await handlers['foods:remove']({ id: first.id });
    await expect(handlers['foods:create'](rice)).resolves.toMatchObject({ name: rice.name });
  });

  it('applies the domain rules', async () => {
    const { handlers } = await setup();
    await expect(
      handlers['foods:create']({ ...rice, proteinG: 50, carbohydrateG: 60 }),
    ).rejects.toThrow(ValidationError);
  });

  it('is a household catalog shared by every profile', async () => {
    const { db, handlers } = await setup();
    for (const name of ['Lucas', 'Ana']) {
      await handlers['profiles:create']({ name, birthDate: null, sex: null, heightCm: null });
    }
    await handlers['foods:create'](rice);
    // No profile column: every profile sees the same catalog (README §6.1).
    const columns = await db.introspection.getTables();
    const foods = columns.find((t) => t.name === 'foods');
    expect(foods?.columns.map((c) => c.name)).not.toContain('profile_id');
    expect(await handlers['foods:list'](undefined)).toHaveLength(1);
  });
});
