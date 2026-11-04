import { NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const done = (weightKg: number, repetitions: number, rir: number) => ({
  weightKg,
  repetitions,
  durationSeconds: null,
  rir,
  completed: true,
  notes: null,
});

describe('exercise history and progression (README §10.5, §10.6)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-27T18:00:00.000Z', '2026-10-27'));
    dispose = app.dispose;
    const { handlers } = app;
    const lucas = await handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await handlers['profiles:create']({ ...person, name: 'Ana' });
    const plan = await handlers['workout-plans:import-template']({
      profileId: lucas.id,
      template: 'cutting_2026',
    });
    const push = must(plan.days.find((d) => d.name === 'Terça — PUSH'));
    const benchId = must(plan.days[1]?.exercises[0]).exerciseId;

    /** One PUSH session where the bench sets get `values`. */
    const train = async (values: ReturnType<typeof done>[]) => {
      const session = await handlers['workout-sessions:start']({
        profileId: lucas.id,
        workoutDayId: push.id,
      });
      const bench = must(session.performances[0]);
      for (const [i, set] of bench.sets.entries()) {
        await handlers['workout-sets:update']({
          profileId: lucas.id,
          id: set.id,
          ...must(values[i]),
        });
      }
      await handlers['workout-sessions:finish']({
        profileId: lucas.id,
        id: session.id,
        notes: null,
      });
    };
    return { ...app, lucas, ana, push, benchId, train };
  };

  it('summarizes finished sessions of an exercise', async () => {
    const { handlers, lucas, benchId, train } = await setup();
    await train([done(90, 8, 2), done(90, 8, 2), done(90, 7, 1)]);
    const history = await handlers['exercises:history']({
      profileId: lucas.id,
      exerciseId: benchId,
    });
    expect(history.sessions).toHaveLength(1);
    expect(history.sessions[0]).toMatchObject({ topWeightKg: 90, volumeKg: 2070 });
    expect(history.sessions[0]?.sets.map((s) => s.repetitions)).toEqual([8, 8, 7]);
    expect(history).toMatchObject({
      bestLoad: { weightKg: 90 },
      bestSet: { weightKg: 90, repetitions: 8 },
      recentSessions: 1,
      loadIncrementKg: null,
    });
  });

  it('suggests a load increase only when double progression is met', async () => {
    const { handlers, lucas, push, train, benchId } = await setup();
    await train([done(90, 8, 2), done(90, 8, 2), done(90, 7, 1)]);
    let session = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    expect(session.performances[0]?.suggestion).toBeNull();
    await handlers['workout-sessions:discard']({ profileId: lucas.id, id: session.id });

    await train([done(90, 8, 2), done(90, 8, 1), done(90, 8, 1)]);
    await handlers['exercises:set-increment']({
      profileId: lucas.id,
      exerciseId: benchId,
      loadIncrementKg: 2.5,
    });
    session = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    expect(session.performances[0]?.suggestion).toEqual({ incrementKg: 2.5 });
    // Only a suggestion: the prefilled load stays the last one.
    expect(session.performances[0]?.sets.map((s) => s.weightKg)).toEqual([90, 90, 90]);
  });

  it('keeps the load increment per profile, also for system exercises', async () => {
    const { handlers, lucas, ana, benchId } = await setup();
    const updated = await handlers['exercises:set-increment']({
      profileId: lucas.id,
      exerciseId: benchId,
      loadIncrementKg: 2.5,
    });
    expect(updated).toMatchObject({ loadIncrementKg: 2.5, profileIncrementKg: 2.5 });
    expect(
      (await handlers['exercises:history']({ profileId: ana.id, exerciseId: benchId }))
        .loadIncrementKg,
    ).toBeNull();
    const cleared = await handlers['exercises:set-increment']({
      profileId: lucas.id,
      exerciseId: benchId,
      loadIncrementKg: null,
    });
    expect(cleared.loadIncrementKg).toBeNull();
    await expect(
      handlers['exercises:set-increment']({
        profileId: lucas.id,
        exerciseId: benchId,
        loadIncrementKg: 60,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('keeps history isolated between profiles', async () => {
    const { handlers, lucas, ana, benchId, train } = await setup();
    await train([done(90, 8, 2), done(90, 8, 2), done(90, 8, 2)]);
    const anaHistory = await handlers['exercises:history']({
      profileId: ana.id,
      exerciseId: benchId,
    });
    expect(anaHistory.sessions).toEqual([]);
    const own = await handlers['exercises:create']({
      profileId: lucas.id,
      name: 'Remada T',
      muscleGroup: 'back',
      secondaryMuscles: [],
      equipment: null,
      instructions: null,
      notes: null,
      loadIncrementKg: 5,
    });
    await expect(
      handlers['exercises:history']({ profileId: ana.id, exerciseId: own.id }),
    ).rejects.toThrow(NotFoundError);
    expect(
      (await handlers['exercises:history']({ profileId: lucas.id, exerciseId: own.id }))
        .loadIncrementKg,
    ).toBe(5);
  });

  it('reports finished sessions with top load and volume per exercise', async () => {
    const { handlers, lucas, ana, push, benchId, train } = await setup();
    await train([done(90, 8, 2), done(100, 5, 1), { ...done(120, 1, 0), completed: false }]);
    // Open and discarded sessions do not count.
    const discarded = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    await handlers['workout-sessions:discard']({ profileId: lucas.id, id: discarded.id });
    await handlers['workout-sessions:start']({ profileId: lucas.id, workoutDayId: push.id });

    const stats = await handlers['workout-stats:get']({ profileId: lucas.id });
    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({ startedAt: '2026-10-27T18:00:00.000Z', dayId: push.id });
    expect(stats[0]?.exercises.find((e) => e.exerciseId === benchId)).toMatchObject({
      topWeightKg: 100,
      volumeKg: 1220,
    });
    // Exercises with no completed set stay with no load and no volume.
    expect(stats[0]?.exercises.find((e) => e.exerciseId !== benchId)).toMatchObject({
      topWeightKg: null,
      volumeKg: 0,
    });
    expect(await handlers['workout-stats:get']({ profileId: ana.id })).toEqual([]);
  });
});
