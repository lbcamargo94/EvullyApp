import { describe, expect, it } from 'vitest';
import {
  nightClockDate,
  normalizeSleepDraft,
  parseLocalDate,
  ValidationError,
  type SleepDraft,
} from '../src';

const today = parseLocalDate('2026-10-27');
const now = '2026-10-27T12:00:00.000Z';
const night: SleepDraft = {
  sleepDate: '2026-10-27',
  bedTime: '2026-10-26T23:30:00.000Z',
  sleepTime: '2026-10-26T23:48:00.000Z',
  wakeTime: '2026-10-27T07:42:00.000Z',
  quality: 4,
  notes: '  ',
};
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as ValidationError).code;
  }
  return null;
};

describe('normalizeSleepDraft (README §7.7)', () => {
  it('derives the duration from falling asleep, or from bedtime', () => {
    expect(normalizeSleepDraft(night, today, now)).toMatchObject({
      sleepDate: '2026-10-27',
      durationMinutes: 474, // 23:48 → 07:42 = 7h54
      quality: 4,
      notes: null,
    });
    expect(normalizeSleepDraft({ ...night, sleepTime: null }, today, now).durationMinutes).toBe(
      492,
    );
  });

  it('rejects wrong order, long spans, future values and bad quality', () => {
    const cases: [Partial<SleepDraft>, string][] = [
      [{ sleepTime: '2026-10-26T23:00:00.000Z' }, 'sleep.order'],
      [{ wakeTime: '2026-10-26T23:48:00.000Z' }, 'sleep.order'],
      [{ bedTime: '2026-10-26T11:00:00.000Z', sleepTime: null }, 'sleep.too_long'],
      [{ sleepDate: '2026-10-28' }, 'sleep.date_in_future'],
      [{ wakeTime: '2026-10-27T12:30:00.000Z' }, 'sleep.time_in_future'],
      [{ quality: 0 }, 'sleep.quality_out_of_range'],
      [{ quality: 2.5 }, 'sleep.quality_out_of_range'],
      [{ bedTime: 'yesterday' }, 'sleep.invalid_time'],
      [{ notes: 'x'.repeat(281) }, 'sleep.notes_too_long'],
    ];
    for (const [patch, expected] of cases) {
      expect(code(() => normalizeSleepDraft({ ...night, ...patch }, today, now))).toBe(expected);
    }
  });
});

describe('nightClockDate', () => {
  const wakeDate = parseLocalDate('2026-10-27');
  it('puts times at or after the wake time on the evening before', () => {
    expect(nightClockDate(wakeDate, 23 * 60 + 48, 7 * 60 + 42)).toBe('2026-10-26');
    expect(nightClockDate(wakeDate, 7 * 60 + 42, 7 * 60 + 42)).toBe('2026-10-26');
    expect(nightClockDate(wakeDate, 30, 7 * 60)).toBe('2026-10-27');
  });
});
