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
};
const allOn = DEFAULT_REMINDER_PREFERENCES.map((p) => ({ ...p, enabled: true }));
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
    };
    expect(dueReminders(input({ facts: done }))).toEqual([]);
    const nothing: ReminderFacts = {
      weighedToday: false,
      lastMeasurement: null,
      tracksMeasurements: false,
      plannedToday: [],
      trainedToday: false,
    };
    expect(dueReminders(input({ facts: nothing }))).toEqual([{ type: 'weighing' }]);
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
});
