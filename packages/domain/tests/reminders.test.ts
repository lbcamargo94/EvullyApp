import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  DEFAULT_REMINDER_PREFERENCES,
  dueReminders,
  inQuietHours,
  parseLocalDate,
  type DueInput,
  type ReminderFacts,
} from '../src';

// A Monday.
const today = parseLocalDate('2026-11-30');
const facts: ReminderFacts = {
  weighedToday: false,
  lastMeasurement: addDaysToLocalDate(today, -7),
  tracksMeasurements: true,
  plannedToday: ['Peito e tríceps'],
  trainedToday: false,
  loggedFoodToday: false,
  proteinBelowTarget: true,
  waterBelowTarget: true,
  pendingHabits: true,
  sleepLoggedToday: false,
  recordedLastWeek: true,
  pending: [],
};
const NEW_TYPES = ['meal', 'protein', 'water', 'habits', 'sleep'] as const;
const allOn = DEFAULT_REMINDER_PREFERENCES.map((p) => ({
  ...p,
  enabled: !(NEW_TYPES as readonly string[]).includes(p.type),
}));
const everyOn = DEFAULT_REMINDER_PREFERENCES.map((p) => ({ ...p, enabled: true }));
const input = (over: Partial<DueInput> = {}): DueInput => ({
  preferences: allOn,
  quietHours: null,
  facts,
  today,
  now: '19:00',
  shownToday: [],
  ...over,
});

describe('dueReminders (README §25)', () => {
  it('shows each enabled reminder past its time, once a day', () => {
    expect(dueReminders(input())).toEqual([
      { type: 'weighing' },
      { type: 'measurements' },
      { type: 'workout', dayNames: ['Peito e tríceps'] },
    ]);
    expect(dueReminders(input({ now: '07:10' }))).toEqual([{ type: 'weighing' }]);
    expect(dueReminders(input({ shownToday: ['weighing', 'measurements', 'workout'] }))).toEqual(
      [],
    );
  });

  it('starts off and stays off when disabled', () => {
    expect(dueReminders(input({ preferences: DEFAULT_REMINDER_PREFERENCES }))).toEqual([]);
  });

  it('is never redundant and never guesses without data', () => {
    const done: ReminderFacts = {
      weighedToday: true,
      lastMeasurement: addDaysToLocalDate(today, -6),
      tracksMeasurements: true,
      plannedToday: ['Peito e tríceps'],
      trainedToday: true,
      loggedFoodToday: true,
      proteinBelowTarget: false,
      waterBelowTarget: false,
      pendingHabits: false,
      sleepLoggedToday: true,
      recordedLastWeek: true,
      pending: [],
    };
    expect(dueReminders(input({ facts: done, preferences: everyOn }))).toEqual([]);
    const nothing: ReminderFacts = {
      weighedToday: false,
      lastMeasurement: null,
      tracksMeasurements: false,
      plannedToday: [],
      trainedToday: false,
      loggedFoodToday: false,
      proteinBelowTarget: null,
      waterBelowTarget: true,
      pendingHabits: false,
      sleepLoggedToday: false,
      recordedLastWeek: false,
      pending: [],
    };
    expect(dueReminders(input({ facts: nothing, preferences: everyOn }))).toEqual([
      { type: 'weighing' },
      { type: 'meal' },
      { type: 'water' },
      { type: 'sleep' },
    ]);
  });

  it('measurements only on the chosen weekday', () => {
    const tuesday = addDaysToLocalDate(today, 1);
    expect(dueReminders(input({ today: tuesday })).some((r) => r.type === 'measurements')).toBe(
      false,
    );
  });

  it('waits for the end of the quiet hours, which may cross midnight', () => {
    const quietHours = { start: '22:00', end: '07:30' };
    expect(dueReminders(input({ now: '07:10', quietHours }))).toEqual([]);
    expect(dueReminders(input({ now: '07:30', quietHours }))).toEqual([
      { type: 'weighing' },
      { type: 'measurements' },
    ]);
    expect(inQuietHours('23:00', quietHours)).toBe(true);
    expect(inQuietHours('12:00', { start: '12:00', end: '14:00' })).toBe(true);
    expect(inQuietHours('14:00', { start: '12:00', end: '14:00' })).toBe(false);
  });

  it('nutrition, water, habits and sleep, each at its own time', () => {
    const on = input({ preferences: everyOn, now: '23:00' });
    expect(dueReminders(on).map((r) => r.type)).toEqual([
      'weighing',
      'measurements',
      'workout',
      ...NEW_TYPES,
    ]);
    expect(dueReminders({ ...on, now: '09:30' }).map((r) => r.type)).toEqual([
      'weighing',
      'measurements',
      'sleep',
    ]);
    // Protein only says something when there is a target and food logged today.
    const fed = { ...facts, loggedFoodToday: true, proteinBelowTarget: false };
    expect(
      dueReminders({ ...on, facts: fed }).some((r) => ['meal', 'protein'].includes(r.type)),
    ).toBe(false);
  });

  it('weekly summary on its weekday, only after a week with records', () => {
    const sunday = addDaysToLocalDate(today, 6);
    const on = input({ preferences: everyOn, today: sunday, now: '19:30' });
    expect(dueReminders(on).some((r) => r.type === 'weekly_summary')).toBe(true);
    expect(dueReminders({ ...on, now: '18:59' }).some((r) => r.type === 'weekly_summary')).toBe(
      false,
    );
    const empty = { ...on, facts: { ...facts, recordedLastWeek: false } };
    expect(dueReminders(empty).some((r) => r.type === 'weekly_summary')).toBe(false);
    expect(
      dueReminders(input({ preferences: everyOn })).some((r) => r.type === 'weekly_summary'),
    ).toBe(false);
  });

  it('pending records list what earlier days left open, and nothing when all is done', () => {
    const pending = ['open_workout', 'habits_yesterday'] as const;
    const on = input({ preferences: everyOn, now: '10:00', facts: { ...facts, pending } });
    expect(dueReminders(on).find((r) => r.type === 'pending_records')).toEqual({
      type: 'pending_records',
      items: ['open_workout', 'habits_yesterday'],
    });
    expect(dueReminders({ ...on, facts }).some((r) => r.type === 'pending_records')).toBe(false);
  });
});
