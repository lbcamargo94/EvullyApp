import { NotFoundError, parseLocalDate, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import type { Clock } from '../src/modules/shared/ports';
import { createTestApp } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };

/** A clock the test moves; 2026-11-30 is a Monday. */
function movableClock(date: string, time: string) {
  let now = { date, time };
  const clock: Clock = {
    nowIso: () => `${now.date}T${now.time}:00.000Z`,
    today: () => parseLocalDate(now.date),
    localTime: () => now.time,
    localToIso: (d, t) => `${d}T${t}:00.000Z`,
    isoToLocal: (iso) => ({ date: parseLocalDate(iso.slice(0, 10)), time: iso.slice(11, 16) }),
  };
  return { clock, goTo: (d: string, t: string) => (now = { date: d, time: t }) };
}

describe('reminders (README §25)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const { clock, goTo } = movableClock('2026-11-30', '06:00');
    const app = await createTestApp(clock);
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    const settings = await app.handlers['reminders:get']({ profileId: lucas.id });
    const turnOn = (profileId: string, quietHours: { start: string; end: string } | null = null) =>
      app.handlers['reminders:set']({
        profileId,
        preferences: settings.preferences.map((p) => ({ ...p, enabled: true })),
        quietHours,
      });
    return { ...app, lucas, ana, settings, turnOn, goTo };
  };

  it('starts with every reminder off, and the app out of the tray', async () => {
    const { settings, reminders, notices, goTo } = await setup();
    expect(settings.preferences.map((p) => [p.type, p.enabled])).toEqual([
      ['weighing', false],
      ['measurements', false],
      ['workout', false],
    ]);
    expect(await reminders.anyOn()).toBe(false);
    goTo('2026-11-30', '23:00');
    expect(await reminders.evaluate()).toBe(0);
    expect(notices).toEqual([]);
  });

  it('shows a reminder once a day, without numbers, and keeps preference history', async () => {
    const { handlers, lucas, ana, turnOn, reminders, notices, goTo, db } = await setup();
    await turnOn(lucas.id);
    expect(await reminders.anyOn()).toBe(true);
    goTo('2026-11-30', '07:05');
    expect(await reminders.evaluate()).toBe(1);
    expect(notices).toEqual([
      {
        profileId: lucas.id,
        title: 'Lucas: hora da pesagem',
        body: 'Registre o peso de hoje no Evully.',
        route: '/app/weight',
      },
    ]);
    goTo('2026-11-30', '08:00');
    expect(await reminders.evaluate()).toBe(0);

    // Saving the same values writes nothing; a change adds a row per type.
    await turnOn(lucas.id);
    await turnOn(lucas.id, { start: '22:00', end: '07:00' });
    const rows = await db.selectFrom('notification_preferences').select('profile_id').execute();
    expect(rows.filter((r) => r.profile_id === lucas.id)).toHaveLength(6);
    expect(await handlers['reminders:get']({ profileId: ana.id })).toMatchObject({
      quietHours: null,
    });
  });

  it('is not redundant: a weighing today keeps the weighing reminder quiet', async () => {
    const { handlers, lucas, turnOn, reminders, notices, goTo } = await setup();
    await turnOn(lucas.id);
    goTo('2026-11-30', '06:30');
    await handlers['weights:register']({
      profileId: lucas.id,
      measuredOn: '2026-11-30',
      measuredAt: '2026-11-30T06:30:00.000Z',
      weightKg: 80,
      tagIds: [],
      notes: null,
    });
    goTo('2026-11-30', '22:00');
    expect(await reminders.evaluate()).toBe(0);
    expect(notices).toEqual([]);
  });

  it('waits for the end of the quiet hours', async () => {
    const { lucas, turnOn, reminders, goTo } = await setup();
    await turnOn(lucas.id, { start: '06:00', end: '08:00' });
    goTo('2026-11-30', '07:30');
    expect(await reminders.evaluate()).toBe(0);
    goTo('2026-11-30', '08:00');
    expect(await reminders.evaluate()).toBe(1);
  });

  it('isolates profiles and skips archived ones (README §6.1)', async () => {
    const { handlers, lucas, ana, turnOn, reminders, notices, goTo } = await setup();
    await turnOn(lucas.id);
    await turnOn(ana.id);
    await handlers['profiles:archive']({ id: ana.id });
    goTo('2026-11-30', '07:05');
    await reminders.evaluate();
    expect(notices.map((n) => n.profileId)).toEqual([lucas.id]);
    await expect(
      handlers['reminders:get']({ profileId: '01900000-0000-7000-8000-00000000ffff' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('measurements need a weekday', async () => {
    const { handlers, lucas, settings } = await setup();
    await expect(
      handlers['reminders:set']({
        profileId: lucas.id,
        preferences: settings.preferences.map((p) => ({ ...p, enabled: true, weekday: null })),
        quietHours: null,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('a clicked reminder is read once', async () => {
    const { handlers } = await setup();
    expect(await handlers['reminders:take-open'](undefined)).toBeNull();
  });
});
