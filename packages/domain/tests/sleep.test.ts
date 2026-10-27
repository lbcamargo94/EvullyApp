import { describe, expect, it } from 'vitest';
import {
  nightClockDate,
  normalizeSleepDraft,
  sleepIndicators,
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

describe('sleepIndicators (README §12.2)', () => {
  const at = (h: number, min = 0) => h * 60 + min;
  const n = (
    sleepDate: string,
    durationMinutes: number,
    startClock: number,
    wakeClock: number,
  ) => ({
    sleepDate,
    durationMinutes,
    startClock,
    wakeClock,
  });

  it('averages the last 7 and 30 days', () => {
    const result = sleepIndicators(
      [
        n('2026-10-27', 480, at(23), at(7)),
        n('2026-10-21', 420, at(23), at(6)),
        n('2026-10-20', 300, at(23), at(4)), // outside 7 days, inside 30
        n('2026-09-27', 600, at(21), at(7)), // outside 30 days
        n('2026-10-28', 999, at(23), at(7)), // future, ignored
      ],
      today,
    );
    expect(result.last7).toEqual({ minutes: 450, nights: 2 });
    expect(result.last30).toEqual({ minutes: 400, nights: 3 });
  });

  it('averages clock times across midnight and measures consistency', () => {
    const result = sleepIndicators(
      [n('2026-10-27', 450, at(23, 30), at(7)), n('2026-10-26', 450, at(0, 30), at(7, 40))],
      today,
    );
    expect(result.bedtime).toBe(0);
    expect(result.wakeTime).toBe(at(7, 20));
    expect(result.consistency).toBe(25); // ±30 for bedtime, ±20 for waking
  });

  it('is empty without nights and has no consistency for one night', () => {
    expect(sleepIndicators([], today)).toEqual({
      last7: { minutes: null, nights: 0 },
      last30: { minutes: null, nights: 0 },
      bedtime: null,
      wakeTime: null,
      consistency: null,
    });
    expect(sleepIndicators([n('2026-10-27', 480, at(23), at(7))], today).consistency).toBeNull();
  });
});
