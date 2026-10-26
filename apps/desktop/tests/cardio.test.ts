import { NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const walk = (sessionDate: string, durationMinutes: number, distanceKm: number | null = null) => ({
  sessionDate,
  startedAt: `${sessionDate}T10:00:00.000Z`,
  activityType: 'walking' as const,
  activityName: null,
  durationMinutes,
  distanceKm,
  steps: null,
  intensity: null,
  heartRateAverage: null,
  notes: null,
});

describe('cardio (README §11.1)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    // Wednesday 2026-10-28: the week runs from Monday 26 to Sunday 1.
    const app = await createTestApp(fixedClock('2026-10-28T12:00:00.000Z', '2026-10-28'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    return { ...app, lucas, ana };
  };

  it('registers sessions and summarizes this week and past weeks', async () => {
    const { handlers, lucas } = await setup();
    await handlers['cardio:register']({ profileId: lucas.id, ...walk('2026-10-26', 45, 3.5) });
    await handlers['cardio:register']({ profileId: lucas.id, ...walk('2026-10-28', 40, 3.2) });
    await handlers['cardio:register']({
      profileId: lucas.id,
      ...walk('2026-10-22', 30),
      activityType: 'cycling',
    });
    const overview = await handlers['cardio:overview']({ profileId: lucas.id });
    expect(overview.thisWeek).toMatchObject({
      weekStart: '2026-10-26',
      sessions: 2,
      minutes: 85,
      distanceKm: 6.7,
    });
    expect(overview.weeks.map((w) => [w.summary.weekStart, w.sessions.length])).toEqual([
      ['2026-10-26', 2],
      ['2026-10-19', 1],
    ]);
    expect(overview.weeks[0]?.sessions.map((s) => s.sessionDate)).toEqual([
      '2026-10-28',
      '2026-10-26',
    ]);
  });

  it('edits and deletes sessions and applies the rules', async () => {
    const { handlers, lucas } = await setup();
    const created = await handlers['cardio:register']({
      profileId: lucas.id,
      ...walk('2026-10-27', 45),
    });
    const edited = await handlers['cardio:update']({
      profileId: lucas.id,
      id: created.id,
      ...walk('2026-10-27', 50),
      steps: 6100,
      intensity: 'moderate',
    });
    expect(edited).toMatchObject({ durationMinutes: 50, steps: 6100, intensity: 'moderate' });
    expect(await handlers['cardio:delete']({ profileId: lucas.id, id: created.id })).toBeNull();
    expect((await handlers['cardio:overview']({ profileId: lucas.id })).weeks).toEqual([]);
    await expect(
      handlers['cardio:register']({ profileId: lucas.id, ...walk('2026-10-29', 30) }),
    ).rejects.toThrow(ValidationError);
  });

  it('keeps sessions isolated between profiles', async () => {
    const { handlers, lucas, ana } = await setup();
    const created = await handlers['cardio:register']({
      profileId: lucas.id,
      ...walk('2026-10-27', 45),
    });
    expect((await handlers['cardio:overview']({ profileId: ana.id })).weeks).toEqual([]);
    await expect(
      handlers['cardio:update']({ profileId: ana.id, id: created.id, ...walk('2026-10-27', 10) }),
    ).rejects.toThrow(NotFoundError);
    await expect(handlers['cardio:delete']({ profileId: ana.id, id: created.id })).rejects.toThrow(
      NotFoundError,
    );
  });
});
