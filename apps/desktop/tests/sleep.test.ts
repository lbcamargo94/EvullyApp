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

  it('keeps nightly targets as history, per profile, and allows clearing', async () => {
    const { db, handlers, lucas, ana } = await setup();
    expect(await handlers['sleep-target:get']({ profileId: lucas.id })).toBeNull();

    await handlers['sleep-target:set']({ profileId: lucas.id, minutesPerNight: 480 });
    const latest = await handlers['sleep-target:set']({
      profileId: lucas.id,
      minutesPerNight: 450,
    });
    expect(latest).toMatchObject({ effectiveFrom: '2026-10-27', minutesPerNight: 450 });
    // A row starting in the future is not in force yet.
    await db
      .insertInto('sleep_targets')
      .values({
        id: '01930000-0000-7000-8000-ffffffffffff',
        profile_id: lucas.id,
        effective_from: '2026-11-02',
        minutes_per_night: 540,
        created_at: '2026-10-27T12:00:01.000Z',
      })
      .execute();
    expect(await handlers['sleep-target:get']({ profileId: lucas.id })).toMatchObject({
      minutesPerNight: 450,
    });
    expect(await handlers['sleep-target:get']({ profileId: ana.id })).toBeNull();

    expect(
      await handlers['sleep-target:set']({ profileId: lucas.id, minutesPerNight: null }),
    ).toBeNull();
    expect(await handlers['sleep-target:get']({ profileId: lucas.id })).toBeNull();
    expect(await db.selectFrom('sleep_targets').select('id').execute()).toHaveLength(4);
    await expect(
      handlers['sleep-target:set']({ profileId: lucas.id, minutesPerNight: 30 }),
    ).rejects.toThrow(ValidationError);
  });
});
