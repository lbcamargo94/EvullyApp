import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const done = (weightKg: number | null, repetitions: number | null, rir: number | null = null) => ({
  weightKg,
  repetitions,
  durationSeconds: null,
  rir,
  completed: true,
  notes: null,
});

describe('workout sessions (README §10.4)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-27T18:00:00.000Z', '2026-10-27'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    const plan = await app.handlers['workout-plans:import-template']({
      profileId: lucas.id,
      template: 'cutting_2026',
    });
    const push = must(plan.days.find((d) => d.name === 'Terça — PUSH'));
    const exercises = await app.handlers['exercises:list']({ profileId: lucas.id });
    const byCode = (code: string) => must(exercises.find((e) => e.code === code)).id;
    return { ...app, lucas, ana, push, byCode };
  };

  it('starts from a plan day with the planned exercises and sets', async () => {
    const { handlers, lucas, push } = await setup();
    const session = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    expect(session).toMatchObject({
      planName: 'Cutting 2026',
      dayName: 'Terça — PUSH',
      finishedAt: null,
    });
    expect(session.performances.map((p) => [p.exerciseName, p.sets.length])).toEqual([
      ['Supino reto', 3],
      ['Supino inclinado com halteres', 3],
      ['Crossover', 2],
      ['Elevação lateral', 4],
      ['Tríceps corda', 3],
      ['Extensão de tríceps acima da cabeça', 2],
    ]);
    expect(session.performances[0]?.prescription).toMatchObject({
      minReps: 6,
      maxReps: 8,
      minRir: 1,
    });
    expect(session.performances[0]?.last).toBeNull();
    expect(await handlers['workout-sessions:open']({ profileId: lucas.id })).toMatchObject({
      id: session.id,
    });
    await expect(
      handlers['workout-sessions:start']({ profileId: lucas.id, workoutDayId: null }),
    ).rejects.toThrow(ConflictError);
  });

  it('records sets, finishes, and shows the last session next time with prefilled loads', async () => {
    const { handlers, lucas, push } = await setup();
    let session = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    const bench = must(session.performances[0]);
    const values = [done(90, 8, 2), done(90, 8, 2), done(90, 7, 1)];
    for (const [i, set] of bench.sets.entries()) {
      session = await handlers['workout-sets:update']({
        profileId: lucas.id,
        id: set.id,
        ...must(values[i]),
      });
    }
    expect(
      session.performances[0]?.sets.map((s) => [s.weightKg, s.repetitions, s.completed]),
    ).toEqual([
      [90, 8, true],
      [90, 8, true],
      [90, 7, true],
    ]);
    expect(
      await handlers['workout-sessions:finish']({
        profileId: lucas.id,
        id: session.id,
        notes: ' Bom treino ',
      }),
    ).toBeNull();
    expect(await handlers['workout-sessions:open']({ profileId: lucas.id })).toBeNull();

    const next = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    const again = must(next.performances[0]);
    expect(again.last).toMatchObject({ weightKg: 90, values: [8, 8, 7], unit: 'reps' });
    expect(again.sets.map((s) => [s.weightKg, s.repetitions, s.completed])).toEqual([
      [90, null, false],
      [90, null, false],
      [90, null, false],
    ]);
  });

  it('adds, swaps and removes exercises and sets during a session', async () => {
    const { handlers, lucas, push, byCode } = await setup();
    let session = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    const crossover = must(session.performances[2]);
    session = await handlers['workout-performances:replace']({
      profileId: lucas.id,
      id: crossover.id,
      exerciseId: byCode('incline_machine_press'),
    });
    expect(session.performances.map((p) => p.exerciseName)).toContain(
      'Supino inclinado em máquina/Smith',
    );
    expect(session.performances.map((p) => p.exerciseName)).not.toContain('Crossover');

    session = await handlers['workout-performances:add']({
      profileId: lucas.id,
      sessionId: session.id,
      exerciseId: byCode('dead_hang'),
    });
    const hang = must(session.performances.at(-1));
    expect(hang).toMatchObject({ exerciseName: 'Dead Hang', prescription: null });
    expect(hang.sets).toHaveLength(3);

    session = await handlers['workout-sets:add']({ profileId: lucas.id, performanceId: hang.id });
    expect(session.performances.at(-1)?.sets.map((s) => s.setNumber)).toEqual([1, 2, 3, 4]);
    session = await handlers['workout-sets:remove']({
      profileId: lucas.id,
      id: must(hang.sets[0]).id,
    });
    expect(session.performances.at(-1)?.sets).toHaveLength(3);
    session = await handlers['workout-performances:remove']({ profileId: lucas.id, id: hang.id });
    expect(session.performances.map((p) => p.exerciseName)).not.toContain('Dead Hang');
  });

  it('needs a completed set to finish, validates values and can be discarded', async () => {
    const { handlers, lucas } = await setup();
    const session = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: null,
    });
    expect(session.performances).toEqual([]);
    await expect(
      handlers['workout-sessions:finish']({ profileId: lucas.id, id: session.id, notes: null }),
    ).rejects.toThrow(ValidationError);
    expect(
      await handlers['workout-sessions:discard']({ profileId: lucas.id, id: session.id }),
    ).toBeNull();
    expect(await handlers['workout-sessions:open']({ profileId: lucas.id })).toBeNull();
  });

  it('keeps sessions isolated between profiles', async () => {
    const { handlers, lucas, ana, push, byCode } = await setup();
    const session = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    const set = must(session.performances[0]?.sets[0]);
    expect(await handlers['workout-sessions:open']({ profileId: ana.id })).toBeNull();
    for (const action of [
      () => handlers['workout-sessions:start']({ profileId: ana.id, workoutDayId: push.id }),
      () => handlers['workout-sets:update']({ profileId: ana.id, id: set.id, ...done(1, 1) }),
      () => handlers['workout-sessions:discard']({ profileId: ana.id, id: session.id }),
      () =>
        handlers['workout-performances:add']({
          profileId: ana.id,
          sessionId: session.id,
          exerciseId: byCode('bench_press'),
        }),
    ]) {
      await expect(action()).rejects.toThrow(NotFoundError);
    }
  });
});
