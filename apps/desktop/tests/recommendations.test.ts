import { ConflictError, NotFoundError, parseLocalDate, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import type { Clock } from '../src/modules/shared/ports';
import { createTestApp, must } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const done = (weightKg: number, repetitions: number, rir: number) => ({
  weightKg,
  repetitions,
  durationSeconds: null,
  rir,
  completed: true,
  notes: null,
});

/** A clock whose day the test moves forward. */
function movableClock(start: string) {
  let today = start;
  const clock: Clock = {
    nowIso: () => `${today}T12:00:00.000Z`,
    today: () => parseLocalDate(today),
    localTime: () => '12:00',
    localToIso: (date, t) => `${date}T${t}:00.000Z`,
    isoToLocal: (iso) => ({ date: parseLocalDate(iso.slice(0, 10)), time: iso.slice(11, 16) }),
  };
  return { clock, goTo: (date: string) => (today = date) };
}

describe('recommendations (README §20.2)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const { clock, goTo } = movableClock('2026-11-01');
    const app = await createTestApp(clock);
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    const weigh = (profileId: string, date: string) =>
      app.handlers['weights:register']({
        profileId,
        measuredOn: date,
        measuredAt: `${date}T07:00:00.000Z`,
        weightKg: 80,
        tagIds: [],
        notes: null,
      });
    return { ...app, lucas, ana, goTo, weigh };
  };

  it('raises a missing-weighing signal once, with its evidence, rule and version', async () => {
    const { handlers, lucas, goTo, weigh } = await setup();
    expect(await handlers['recommendations:list']({ profileId: lucas.id })).toEqual({
      open: [],
      history: [],
    });
    await weigh(lucas.id, '2026-11-01');
    goTo('2026-11-08');
    const first = await handlers['recommendations:list']({ profileId: lucas.id });
    expect(first.open).toEqual([
      expect.objectContaining({
        ruleId: 'weight_missing',
        ruleVersion: 1,
        level: 'info',
        detectedOn: '2026-11-08',
        status: 'open',
        evidence: { lastDate: '2026-11-01', daysSince: 7, limitDays: 7 },
      }),
    ]);
    // Listing again the same or the next day does not repeat it.
    goTo('2026-11-09');
    const again = await handlers['recommendations:list']({ profileId: lucas.id });
    expect(again.open).toHaveLength(1);
    expect(again.open[0]?.id).toBe(first.open[0]?.id);
  });

  it('resolves a signal when a new record answers it', async () => {
    const { handlers, lucas, goTo, weigh } = await setup();
    await weigh(lucas.id, '2026-11-01');
    goTo('2026-11-10');
    await handlers['recommendations:list']({ profileId: lucas.id });
    await weigh(lucas.id, '2026-11-10');
    const list = await handlers['recommendations:list']({ profileId: lucas.id });
    expect(list.open).toEqual([]);
    expect(list.history.map((s) => s.status)).toEqual(['resolved']);
  });

  it('snoozes for 7 days and keeps a dismissed signal quiet for 14', async () => {
    const { handlers, lucas, goTo, weigh } = await setup();
    await weigh(lucas.id, '2026-11-01');
    goTo('2026-11-08');
    const [signal] = (await handlers['recommendations:list']({ profileId: lucas.id })).open;
    const snoozed = await handlers['recommendations:decide']({
      profileId: lucas.id,
      id: must(signal).id,
      decision: 'snoozed',
    });
    expect(snoozed.open).toEqual([]);
    expect(snoozed.history[0]).toMatchObject({ status: 'snoozed', snoozedUntil: '2026-11-15' });
    await expect(
      handlers['recommendations:decide']({
        profileId: lucas.id,
        id: must(signal).id,
        decision: 'dismissed',
      }),
    ).rejects.toThrow(ConflictError);

    goTo('2026-11-15');
    const back = await handlers['recommendations:list']({ profileId: lucas.id });
    expect(back.open.map((s) => s.id)).toEqual([must(signal).id]);

    await handlers['recommendations:decide']({
      profileId: lucas.id,
      id: must(signal).id,
      decision: 'dismissed',
    });
    goTo('2026-11-28');
    expect((await handlers['recommendations:list']({ profileId: lucas.id })).open).toEqual([]);
    goTo('2026-11-29');
    const raised = (await handlers['recommendations:list']({ profileId: lucas.id })).open;
    expect(raised).toHaveLength(1);
    expect(raised[0]?.id).not.toBe(must(signal).id);
  });

  it('raises a double-progression signal from the active plan', async () => {
    const { handlers, lucas, goTo } = await setup();
    const plan = await handlers['workout-plans:import-template']({
      profileId: lucas.id,
      template: 'cutting_2026',
    });
    const push = must(plan.days.find((d) => d.name === 'Terça — PUSH'));
    const session = await handlers['workout-sessions:start']({
      profileId: lucas.id,
      workoutDayId: push.id,
    });
    const bench = must(session.performances[0]);
    for (const set of bench.sets) {
      await handlers['workout-sets:update']({ profileId: lucas.id, id: set.id, ...done(90, 8, 1) });
    }
    await handlers['workout-sessions:finish']({ profileId: lucas.id, id: session.id, notes: null });
    goTo('2026-11-02');
    const { open } = await handlers['recommendations:list']({ profileId: lucas.id });
    expect(open).toEqual([
      expect.objectContaining({
        ruleId: 'double_progression',
        ruleVersion: 2,
        subjectKey: '2026-11-01',
        evidence: {
          lastDate: '2026-11-01',
          exercises: [
            expect.objectContaining({ exerciseName: bench.exerciseName, values: [8, 8, 8] }),
          ],
        },
      }),
    ]);
  });

  it('flags the pace outside the project band, and only with a band', async () => {
    const { handlers, lucas, ana, goTo } = await setup();
    const project = await handlers['projects:create']({
      profileId: lucas.id,
      name: 'Verão',
      objective: 'fat_loss',
      startDate: '2026-11-01',
      targetDate: '2027-01-31',
    });
    expect(project).toMatchObject({ weeklyRateMinKg: null, weeklyRateMaxKg: null });
    // Losing 0.2 kg a day for 3 weeks: −1,4 kg/week.
    for (let day = 1; day <= 21; day++) {
      const date = `2026-11-${String(day).padStart(2, '0')}`;
      goTo(date);
      await handlers['weights:register']({
        profileId: lucas.id,
        measuredOn: date,
        measuredAt: `${date}T07:00:00.000Z`,
        weightKg: 90 - day * 0.2,
        tagIds: [],
        notes: null,
      });
    }
    const rules = (list: { open: { ruleId: string }[] }) => list.open.map((s) => s.ruleId);
    expect(rules(await handlers['recommendations:list']({ profileId: lucas.id }))).toEqual([]);

    const banded = await handlers['projects:set-rate-band']({
      profileId: lucas.id,
      id: project.id,
      weeklyRateMinKg: -0.754,
      weeklyRateMaxKg: -0.25,
    });
    expect(banded).toMatchObject({ weeklyRateMinKg: -0.75, weeklyRateMaxKg: -0.25 });
    const { open } = await handlers['recommendations:list']({ profileId: lucas.id });
    expect(open).toEqual([
      expect.objectContaining({
        ruleId: 'weight_rate_out_of_band',
        level: 'attention',
        evidence: { days: 14, ratePerWeekKg: -1.4, minKg: -0.75, maxKg: -0.25 },
      }),
    ]);
    await expect(
      handlers['projects:set-rate-band']({
        profileId: lucas.id,
        id: project.id,
        weeklyRateMinKg: -0.25,
        weeklyRateMaxKg: null,
      }),
    ).rejects.toThrow(ValidationError);
    await expect(
      handlers['projects:set-rate-band']({
        profileId: ana.id,
        id: project.id,
        weeklyRateMinKg: null,
        weeklyRateMaxKg: null,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('keeps rules the profile turned off quiet, and resolves their open signals', async () => {
    const { handlers, lucas, goTo, weigh } = await setup();
    await weigh(lucas.id, '2026-11-01');
    goTo('2026-11-08');
    await handlers['recommendations:list']({ profileId: lucas.id });
    expect(
      await handlers['recommendation-settings:set']({
        profileId: lucas.id,
        disabledRules: ['weight_missing', 'weight_missing'],
      }),
    ).toEqual({ disabledRules: ['weight_missing'] });
    const list = await handlers['recommendations:list']({ profileId: lucas.id });
    expect(list.open).toEqual([]);
    expect(list.history.map((s) => s.status)).toEqual(['resolved']);
    expect(await handlers['recommendation-settings:get']({ profileId: lucas.id })).toEqual({
      disabledRules: ['weight_missing'],
    });
  });

  it('isolates profiles (README §6.1)', async () => {
    const { handlers, lucas, ana, goTo, weigh } = await setup();
    await weigh(lucas.id, '2026-11-01');
    goTo('2026-11-08');
    const [signal] = (await handlers['recommendations:list']({ profileId: lucas.id })).open;
    expect(await handlers['recommendations:list']({ profileId: ana.id })).toEqual({
      open: [],
      history: [],
    });
    await expect(
      handlers['recommendations:decide']({
        profileId: ana.id,
        id: must(signal).id,
        decision: 'dismissed',
      }),
    ).rejects.toThrow(NotFoundError);
    expect(await handlers['recommendation-settings:get']({ profileId: ana.id })).toEqual({
      disabledRules: [],
    });
  });
});
