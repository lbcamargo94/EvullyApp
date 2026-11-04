import { ConflictError, evolutionSummary, parseLocalDate } from '@evully/domain';
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

    // 2026-11-03 is a Tuesday: today's planned workout is already finished (Hoje).
    const stats = await handlers['workout-stats:get']({ profileId });
    expect(stats.at(-1)).toMatchObject({ startedAt: clock.localToIso(today, '06:30') });
    expect(stats.at(-1)?.dayId).not.toBeNull();

    // Every line of "Últimos 14 dias" has data (README §13.3).
    const weights = await handlers['weights:list']({ profileId });
    const { items } = await handlers['measurements:summary']({ profileId });
    const plans = await handlers['workout-plans:list']({ profileId });
    const summary = evolutionSummary(
      {
        weights: weights.map((w) => ({ date: w.measuredOn, value: w.weightKg })),
        waist: (items.find((i) => i.bodyRegion === 'waist')?.series ?? []).map((p) => ({
          date: p.date,
          value: p.valueCm,
        })),
        workouts: stats.map((w) => ({
          date: new Date(w.startedAt).toLocaleDateString('sv-SE'),
          value: w.exercises.reduce((sum, e) => sum + e.volumeKg, 0),
        })),
        plannedWeekdays: plans.flatMap((p) =>
          p.days.flatMap((d) => (d.weekday ? [d.weekday] : [])),
        ),
        protein: (await handlers['nutrition:history']({ profileId })).map((d) => ({
          date: d.date,
          value: d.proteinG,
        })),
        sleep: (await handlers['sleep:list']({ profileId })).map((n) => ({
          date: n.sleepDate,
          value: n.durationMinutes,
        })),
      },
      today,
    );
    expect(Object.values(summary).every((line) => line !== null)).toBe(true);

    expect(await handlers['weights:list']({ profileId: ana.id })).toEqual([]);
    expect(await handlers['workout-stats:get']({ profileId: ana.id })).toEqual([]);
    await expect(seedDemo(handlers, clock, today)).rejects.toThrow(ConflictError);
  }, 120_000);
});
