import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { name: 'Lucas', birthDate: null, sex: null, heightCm: null };
const at = (date: string, time = '07:00') => ({
  measuredOn: date,
  measuredAt: `${date}T${time}:00.000Z`,
});

describe('weights', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-22T12:00:00.000Z', '2026-10-22'));
    dispose = app.dispose;
    const { id: profileId } = await app.handlers['profiles:create'](person);
    await app.handlers['tracking:accept']({
      profileId,
      answers: {
        project: {
          name: 'Shape de Praia',
          objective: 'fat_loss',
          startDate: '2026-10-05',
          targetDate: '2026-12-06',
        },
        focusAreas: ['waist'],
        weightDisplay: 'trend',
        interests: { menstrualCycle: null, progressPhotos: null, pin: null, weighingDevice: null },
        suggestion: null,
      },
    });
    const register = (
      date: string,
      weightKg: number,
      extra: { tagIds?: string[]; time?: string } = {},
    ) =>
      app.handlers['weights:register']({
        profileId,
        ...at(date, extra.time),
        weightKg,
        tagIds: extra.tagIds ?? [],
        notes: null,
      });
    return { ...app, profileId, register };
  };

  it('registers a weighing with tags and lists it', async () => {
    const { handlers, profileId, register } = await setup();
    const [retention] = await handlers['tags:list']({ profileId });
    const entry = await register('2026-10-09', 91.456, { tagIds: [must(retention).id] });
    expect(entry).toMatchObject({ weightKg: 91.46, measuredOn: '2026-10-09', notes: null });
    expect(entry.tags).toEqual([{ id: must(retention).id, name: 'Retenção' }]);
    expect(await handlers['weights:list']({ profileId })).toEqual([entry]);
  });

  it('summarizes the project as in README §8.5', async () => {
    const { handlers, profileId, register } = await setup();
    await register('2026-10-05', 92.0);
    for (const [day, kg] of [
      ['16', 90.3],
      ['17', 90.0],
      ['18', 90.4],
      ['19', 89.9],
      ['20', 90.1],
      ['21', 90.2],
    ] as const) {
      await register(`2026-10-${day}`, kg);
    }
    await register('2026-10-22', 90.5, { time: '06:00' });
    await register('2026-10-22', 89.8, { time: '07:30' }); // latest of the day wins

    const summary = await handlers['weights:summary']({ profileId });
    expect(summary).toMatchObject({
      objective: 'fat_loss',
      current: { date: '2026-10-22', weightKg: 89.8 },
      start: { date: '2026-10-05', weightKg: 92 },
      change: -2.2,
      trend: 90.1,
      trendChange: -1.9,
    });
    expect(summary.series).toHaveLength(8);
  });

  it('updates the weighing and replaces its tags', async () => {
    const { handlers, profileId, register } = await setup();
    const [a, b] = await handlers['tags:list']({ profileId });
    const entry = await register('2026-10-20', 90, { tagIds: [must(a).id] });
    const updated = await handlers['weights:update']({
      id: entry.id,
      profileId,
      ...at('2026-10-20', '08:00'),
      weightKg: 90.2,
      tagIds: [must(b).id],
      notes: 'Após viagem',
    });
    expect(updated).toMatchObject({ weightKg: 90.2, notes: 'Após viagem' });
    expect(updated.tags.map((t) => t.id)).toEqual([must(b).id]);
  });

  it('soft-deletes and then hides the weighing', async () => {
    const { db, handlers, profileId, register } = await setup();
    const entry = await register('2026-10-20', 90);
    expect(await handlers['weights:delete']({ profileId, id: entry.id })).toBeNull();
    expect(await handlers['weights:list']({ profileId })).toEqual([]);
    const row = await db.selectFrom('body_weights').select('deleted_at').executeTakeFirst();
    expect(row?.deleted_at).toBe('2026-10-22T12:00:00.000Z');
    await expect(handlers['weights:delete']({ profileId, id: entry.id })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('applies the domain rules', async () => {
    const { register } = await setup();
    await expect(register('2026-10-23', 90)).rejects.toThrow(ValidationError);
    await expect(register('2026-10-20', 401)).rejects.toThrow(ValidationError);
  });

  it('keeps profiles isolated, including their tags', async () => {
    const { handlers, profileId, register } = await setup();
    const other = await handlers['profiles:create']({ ...person, name: 'Ana' });
    await handlers['tracking:skip']({ profileId: other.id });
    const [otherTag] = await handlers['tags:list']({ profileId: other.id });

    const mine = await register('2026-10-20', 90);
    await expect(register('2026-10-20', 90, { tagIds: [must(otherTag).id] })).rejects.toThrow(
      ValidationError,
    );
    expect(await handlers['weights:list']({ profileId: other.id })).toEqual([]);
    await expect(handlers['weights:delete']({ profileId: other.id, id: mine.id })).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      handlers['weights:update']({
        id: mine.id,
        profileId: other.id,
        ...at('2026-10-20'),
        weightKg: 50,
        tagIds: [],
        notes: null,
      }),
    ).rejects.toThrow(NotFoundError);
    expect((await handlers['weights:list']({ profileId }))[0]?.weightKg).toBe(90);
  });

  it('creates tags at the end of the list, unique per profile', async () => {
    const { handlers, profileId } = await setup();
    const created = await handlers['tags:create']({ profileId, name: '  Pós festa ' });
    expect(created.name).toBe('Pós festa');
    const names = (await handlers['tags:list']({ profileId })).map((t) => t.name);
    expect(names.at(-1)).toBe('Pós festa');
    await expect(handlers['tags:create']({ profileId, name: 'pós FESTA' })).rejects.toThrow(
      ConflictError,
    );

    const other = await handlers['profiles:create']({ ...person, name: 'Ana' });
    // Same name is fine on another profile, and it does not leak between profiles.
    await handlers['tags:create']({ profileId: other.id, name: 'Pós festa' });
    expect((await handlers['tags:list']({ profileId: other.id })).map((t) => t.name)).toEqual([
      'Pós festa',
    ]);
  });
});
