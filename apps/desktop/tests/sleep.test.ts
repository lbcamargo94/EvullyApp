import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const night = (sleepDate: string, bedTime: string, wakeTime: string) => ({
  sleepDate,
  bedTime,
  sleepTime: null,
  wakeTime,
  quality: null,
  notes: null,
});

describe('sleep (README §7.7, §12.1)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-27T12:00:00.000Z', '2026-10-27'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    return { ...app, lucas, ana };
  };

  it('registers nights with the derived duration, newest first', async () => {
    const { handlers, lucas } = await setup();
    await handlers['sleep:register']({
      profileId: lucas.id,
      ...night('2026-10-26', '2026-10-25T23:00:00.000Z', '2026-10-26T06:30:00.000Z'),
    });
    const created = await handlers['sleep:register']({
      profileId: lucas.id,
      ...night('2026-10-27', '2026-10-26T23:30:00.000Z', '2026-10-27T07:42:00.000Z'),
      sleepTime: '2026-10-26T23:48:00.000Z',
      quality: 4,
    });
    expect(created).toMatchObject({ durationMinutes: 474, quality: 4 });
    const list = await handlers['sleep:list']({ profileId: lucas.id });
    expect(list.map((n) => [n.sleepDate, n.durationMinutes])).toEqual([
      ['2026-10-27', 474],
      ['2026-10-26', 450],
    ]);
  });

  it('keeps one night per day, edits, deletes and applies the rules', async () => {
    const { handlers, lucas } = await setup();
    const input = night('2026-10-27', '2026-10-26T23:00:00.000Z', '2026-10-27T07:00:00.000Z');
    const created = await handlers['sleep:register']({ profileId: lucas.id, ...input });
    await expect(handlers['sleep:register']({ profileId: lucas.id, ...input })).rejects.toThrow(
      ConflictError,
    );
    const edited = await handlers['sleep:update']({
      profileId: lucas.id,
      id: created.id,
      ...input,
      wakeTime: '2026-10-27T07:30:00.000Z',
    });
    expect(edited.durationMinutes).toBe(510);
    await expect(
      handlers['sleep:register']({ ...input, profileId: lucas.id, wakeTime: input.bedTime }),
    ).rejects.toThrow(ValidationError);

    expect(await handlers['sleep:delete']({ profileId: lucas.id, id: created.id })).toBeNull();
    expect(await handlers['sleep:list']({ profileId: lucas.id })).toEqual([]);
    // The day is free again after deleting.
    await handlers['sleep:register']({ profileId: lucas.id, ...input });
  });

  it('keeps nights isolated between profiles', async () => {
    const { handlers, lucas, ana } = await setup();
    const input = night('2026-10-27', '2026-10-26T23:00:00.000Z', '2026-10-27T07:00:00.000Z');
    const created = await handlers['sleep:register']({ profileId: lucas.id, ...input });
    expect(await handlers['sleep:list']({ profileId: ana.id })).toEqual([]);
    // Same day for another profile is fine.
    await handlers['sleep:register']({ profileId: ana.id, ...input });
    await expect(
      handlers['sleep:update']({ profileId: ana.id, id: created.id, ...input }),
    ).rejects.toThrow(NotFoundError);
    await expect(handlers['sleep:delete']({ profileId: ana.id, id: created.id })).rejects.toThrow(
      NotFoundError,
    );
  });
});
