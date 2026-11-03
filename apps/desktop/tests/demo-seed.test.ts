import { ConflictError, parseLocalDate } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { seedClock, seedDemo } from '../seed/demo-seed';
import { createTestApp } from './helpers';

const today = parseLocalDate('2026-11-03');

describe('demo seed (npm run seed)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  it('builds a history in every module, leaves other profiles alone and runs once', async () => {
    const clock = seedClock(today);
    const app = await createTestApp(clock);
    dispose = app.dispose;
    const { handlers } = app;
    const ana = await handlers['profiles:create']({
      name: 'Ana',
      birthDate: null,
      sex: null,
      heightCm: null,
    });

    const result = await seedDemo(handlers, clock, today);
    const profileId = result.profileId;
    expect(result.weights).toBeGreaterThan(90);
    expect(result.workouts).toBeGreaterThan(50);
    expect((await handlers['weights:list']({ profileId })).length).toBe(result.weights);
    expect((await handlers['workout-stats:get']({ profileId })).length).toBe(result.workouts);
    expect((await handlers['sleep:list']({ profileId })).length).toBe(result.nights);
    expect((await handlers['measurements:list']({ profileId })).length).toBe(9);
    expect((await handlers['nutrition:history']({ profileId })).length).toBeGreaterThan(100);
    expect((await handlers['cardio:overview']({ profileId })).target?.minutesPerWeek).toBe(150);
    expect(await handlers['projects:get-active']({ profileId })).toMatchObject({
      startDate: '2026-08-05',
    });
    const day = await handlers['nutrition:day']({ profileId, date: today });
    expect(day.totals.consumed.caloriesKcal).toBeGreaterThan(0);
    expect(day.totals.planned.caloriesKcal).toBeGreaterThan(day.totals.consumed.caloriesKcal);
    expect(await handlers['workout-sessions:open']({ profileId })).toBeNull();

    expect(await handlers['weights:list']({ profileId: ana.id })).toEqual([]);
    expect(await handlers['workout-stats:get']({ profileId: ana.id })).toEqual([]);
    await expect(seedDemo(handlers, clock, today)).rejects.toThrow(ConflictError);
  }, 120_000);
});
