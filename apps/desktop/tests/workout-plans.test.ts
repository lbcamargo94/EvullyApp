import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const reps = (sets: number, min: number, max: number) => ({
  sets,
  targetType: 'reps' as const,
  minReps: min,
  maxReps: max,
  minSeconds: null,
  maxSeconds: null,
  perSide: false,
  minRir: null,
  maxRir: null,
  minRestSeconds: null,
  maxRestSeconds: null,
  notes: null,
});

describe('workout plans (README §10.2, §10.3)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-26T12:00:00.000Z', '2026-10-26'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    const exercises = await app.handlers['exercises:list']({ profileId: lucas.id });
    const byCode = (code: string) => must(exercises.find((e) => e.code === code)).id;
    return { ...app, lucas, ana, byCode };
  };

  it('builds a plan with days and prescribed exercises', async () => {
    const { handlers, lucas, byCode } = await setup();
    let plan = await handlers['workout-plans:create']({ profileId: lucas.id, name: 'Meu plano' });
    plan = await handlers['workout-days:add']({
      profileId: lucas.id,
      planId: plan.id,
      name: 'PUSH',
      weekday: 2,
    });
    const dayId = must(plan.days[0]).id;
    await handlers['plan-exercises:add']({
      profileId: lucas.id,
      dayId,
      exerciseId: byCode('bench_press'),
      prescription: {
        ...reps(3, 6, 8),
        minRir: 1,
        maxRir: 2,
        minRestSeconds: 150,
        maxRestSeconds: 180,
      },
    });
    plan = await handlers['plan-exercises:add']({
      profileId: lucas.id,
      dayId,
      exerciseId: byCode('lateral_raise'),
      prescription: reps(4, 10, 15),
    });
    expect(plan.days[0]?.exercises.map((e) => [e.exerciseName, e.prescription.sets])).toEqual([
      ['Supino reto', 3],
      ['Elevação lateral', 4],
    ]);

    const second = must(plan.days[0]?.exercises[1]);
    plan = await handlers['plan-exercises:move']({
      profileId: lucas.id,
      id: second.id,
      direction: 'up',
    });
    expect(plan.days[0]?.exercises.map((e) => e.exerciseName)).toEqual([
      'Elevação lateral',
      'Supino reto',
    ]);

    plan = await handlers['plan-exercises:update']({
      profileId: lucas.id,
      id: second.id,
      prescription: reps(3, 12, 20),
    });
    expect(plan.days[0]?.exercises[0]?.prescription).toMatchObject({
      sets: 3,
      minReps: 12,
      maxReps: 20,
    });

    plan = await handlers['plan-exercises:remove']({ profileId: lucas.id, id: second.id });
    expect(plan.days[0]?.exercises).toHaveLength(1);
    await expect(
      handlers['plan-exercises:add']({
        profileId: lucas.id,
        dayId,
        exerciseId: byCode('bench_press'),
        prescription: reps(3, 9, 8),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('renames, archives and restores plans with unique names', async () => {
    const { handlers, lucas } = await setup();
    const plan = await handlers['workout-plans:create']({ profileId: lucas.id, name: 'A' });
    await handlers['workout-plans:create']({ profileId: lucas.id, name: 'B' });
    await expect(
      handlers['workout-plans:create']({ profileId: lucas.id, name: 'b' }),
    ).rejects.toThrow(ConflictError);
    const archived = await handlers['workout-plans:update']({
      profileId: lucas.id,
      id: plan.id,
      name: 'A',
      status: 'archived',
    });
    expect(archived.status).toBe('archived');
    const restored = await handlers['workout-plans:update']({
      profileId: lucas.id,
      id: plan.id,
      name: 'A2',
      status: 'active',
    });
    expect(restored).toMatchObject({ name: 'A2', status: 'active' });
  });

  it('imports the README template plans as editable copies', async () => {
    const { handlers, lucas } = await setup();
    const cutting = await handlers['workout-plans:import-template']({
      profileId: lucas.id,
      template: 'cutting_2026',
    });
    expect(cutting.name).toBe('Cutting 2026');
    expect(cutting.days.map((d) => [d.name, d.weekday, d.exercises.length])).toEqual([
      ['Segunda — PULL + antebraço', 1, 10],
      ['Terça — PUSH', 2, 6],
      ['Quarta — LEGS A', 3, 6],
      ['Quinta — UPPER + antebraço', 4, 10],
      ['Sexta — LEGS B + lombar', 5, 7],
    ]);
    expect(cutting.days[1]?.exercises[0]?.prescription).toMatchObject({
      sets: 3,
      minReps: 6,
      maxReps: 8,
      minRir: 1,
      maxRir: 2,
      minRestSeconds: 150,
      maxRestSeconds: 180,
    });
    const again = await handlers['workout-plans:import-template']({
      profileId: lucas.id,
      template: 'cutting_2026',
    });
    expect(again.name).toBe('Cutting 2026 (2)');
    const core = await handlers['workout-plans:import-template']({
      profileId: lucas.id,
      template: 'core_home',
    });
    expect(
      core.days[0]?.exercises.find((e) => e.exerciseName === 'Dead Bug')?.prescription.perSide,
    ).toBe(true);
    expect((await handlers['workout-plans:list']({ profileId: lucas.id })).length).toBe(3);
  });

  it('days can be renamed, moved and removed', async () => {
    const { handlers, lucas } = await setup();
    let plan = await handlers['workout-plans:import-template']({
      profileId: lucas.id,
      template: 'cutting_2026',
    });
    const friday = must(plan.days[4]);
    plan = await handlers['workout-days:move']({
      profileId: lucas.id,
      id: friday.id,
      direction: 'up',
    });
    expect(plan.days[3]?.id).toBe(friday.id);
    plan = await handlers['workout-days:update']({
      profileId: lucas.id,
      id: friday.id,
      name: 'LEGS B',
      weekday: null,
    });
    expect(plan.days[3]).toMatchObject({ name: 'LEGS B', weekday: null });
    plan = await handlers['workout-days:remove']({ profileId: lucas.id, id: friday.id });
    expect(plan.days).toHaveLength(4);
  });

  it('keeps plans isolated between profiles', async () => {
    const { handlers, lucas, ana, byCode } = await setup();
    const plan = await handlers['workout-plans:import-template']({
      profileId: lucas.id,
      template: 'core_home',
    });
    const day = must(plan.days[0]);
    const item = must(day.exercises[0]);
    expect(await handlers['workout-plans:list']({ profileId: ana.id })).toEqual([]);
    for (const action of [
      () =>
        handlers['workout-plans:update']({
          profileId: ana.id,
          id: plan.id,
          name: 'X',
          status: 'archived',
        }),
      () =>
        handlers['workout-days:add']({
          profileId: ana.id,
          planId: plan.id,
          name: 'X',
          weekday: null,
        }),
      () => handlers['workout-days:remove']({ profileId: ana.id, id: day.id }),
      () => handlers['plan-exercises:remove']({ profileId: ana.id, id: item.id }),
      () =>
        handlers['plan-exercises:add']({
          profileId: ana.id,
          dayId: day.id,
          exerciseId: byCode('bench_press'),
          prescription: reps(3, 6, 8),
        }),
    ]) {
      await expect(action()).rejects.toThrow(NotFoundError);
    }
    // Ana cannot use Lucas's own exercises either.
    const own = await handlers['exercises:create']({
      profileId: lucas.id,
      name: 'Remada T',
      muscleGroup: 'back',
      secondaryMuscles: [],
      equipment: null,
      instructions: null,
      notes: null,
      loadIncrementKg: null,
    });
    const anaPlan = await handlers['workout-plans:create']({ profileId: ana.id, name: 'P' });
    const anaDay = await handlers['workout-days:add']({
      profileId: ana.id,
      planId: anaPlan.id,
      name: 'D',
      weekday: null,
    });
    await expect(
      handlers['plan-exercises:add']({
        profileId: ana.id,
        dayId: must(anaDay.days[0]).id,
        exerciseId: own.id,
        prescription: reps(3, 6, 8),
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('flags exercises deactivated in the library but keeps them in the plan', async () => {
    const { handlers, lucas } = await setup();
    const own = await handlers['exercises:create']({
      profileId: lucas.id,
      name: 'Remada T',
      muscleGroup: 'back',
      secondaryMuscles: [],
      equipment: null,
      instructions: null,
      notes: null,
      loadIncrementKg: null,
    });
    let plan = await handlers['workout-plans:create']({ profileId: lucas.id, name: 'P' });
    plan = await handlers['workout-days:add']({
      profileId: lucas.id,
      planId: plan.id,
      name: 'D',
      weekday: null,
    });
    await handlers['plan-exercises:add']({
      profileId: lucas.id,
      dayId: must(plan.days[0]).id,
      exerciseId: own.id,
      prescription: reps(3, 8, 10),
    });
    await handlers['exercises:deactivate']({ profileId: lucas.id, id: own.id });
    const [listed] = await handlers['workout-plans:list']({ profileId: lucas.id });
    expect(listed?.days[0]?.exercises[0]).toMatchObject({
      exerciseName: 'Remada T',
      exerciseActive: false,
    });
  });
});
