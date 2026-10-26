import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const own = {
  name: 'Remada cavalinho',
  muscleGroup: 'back' as const,
  secondaryMuscles: ['biceps' as const],
  equipment: 'barra T',
  instructions: null,
  notes: null,
  loadIncrementKg: 2.5,
};

describe('exercise library (README §10.1)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-25T12:00:00.000Z', '2026-10-25'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    return { ...app, lucas, ana };
  };

  it('ships a read-only system catalog with the exercises of README §10.7–10.9', async () => {
    const { handlers, lucas } = await setup();
    const list = await handlers['exercises:list']({ profileId: lucas.id });
    expect(list.length).toBeGreaterThanOrEqual(40);
    expect(list.every((e) => e.isSystem)).toBe(true);
    const bench = must(list.find((e) => e.code === 'bench_press'));
    expect(bench).toMatchObject({ name: 'Supino reto', muscleGroup: 'chest' });
    expect(list.map((e) => e.code)).toEqual(
      expect.arrayContaining(['dead_bug', 'bird_dog', 'back_extension_45', 'romanian_deadlift']),
    );
    await expect(
      handlers['exercises:update']({ profileId: lucas.id, id: bench.id, ...own }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      handlers['exercises:deactivate']({ profileId: lucas.id, id: bench.id }),
    ).rejects.toThrow(NotFoundError);
  });

  it('creates, edits and deactivates the profile own exercises', async () => {
    const { handlers, lucas } = await setup();
    const created = await handlers['exercises:create']({ profileId: lucas.id, ...own });
    expect(created).toMatchObject({ ...own, isSystem: false, code: null });

    const edited = await handlers['exercises:update']({
      profileId: lucas.id,
      id: created.id,
      ...own,
      name: 'Remada T',
      loadIncrementKg: null,
    });
    expect(edited).toMatchObject({ name: 'Remada T', loadIncrementKg: null });

    expect(
      await handlers['exercises:deactivate']({ profileId: lucas.id, id: created.id }),
    ).toBeNull();
    const names = (await handlers['exercises:list']({ profileId: lucas.id })).map((e) => e.name);
    expect(names).not.toContain('Remada T');
  });

  it('keeps names unique among the system catalog and the profile exercises', async () => {
    const { handlers, lucas } = await setup();
    await expect(
      handlers['exercises:create']({ profileId: lucas.id, ...own, name: 'SUPINO RETO' }),
    ).rejects.toThrow(ConflictError);
    await handlers['exercises:create']({ profileId: lucas.id, ...own });
    await expect(handlers['exercises:create']({ profileId: lucas.id, ...own })).rejects.toThrow(
      ConflictError,
    );
    await expect(
      handlers['exercises:create']({ profileId: lucas.id, ...own, name: 'X', loadIncrementKg: 99 }),
    ).rejects.toThrow(ValidationError);
  });

  it('keeps each profile own exercises isolated', async () => {
    const { handlers, lucas, ana } = await setup();
    const created = await handlers['exercises:create']({ profileId: lucas.id, ...own });
    const anaList = await handlers['exercises:list']({ profileId: ana.id });
    expect(anaList.some((e) => e.id === created.id)).toBe(false);
    // The same name is fine for another profile.
    await expect(
      handlers['exercises:create']({ profileId: ana.id, ...own }),
    ).resolves.toMatchObject({
      name: own.name,
    });
    await expect(
      handlers['exercises:update']({ profileId: ana.id, id: created.id, ...own }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      handlers['exercises:deactivate']({ profileId: ana.id, id: created.id }),
    ).rejects.toThrow(NotFoundError);
  });
});
