import { describe, expect, it } from 'vitest';
import {
  normalizeCardioDraft,
  normalizeCardioTarget,
  parseLocalDate,
  ValidationError,
  weekStartOf,
  weekSummary,
  type CardioDraft,
} from '../src';

const today = parseLocalDate('2026-10-26');
const walk: CardioDraft = {
  sessionDate: '2026-10-26',
  startedAt: '2026-10-26T10:00:00.000Z',
  activityType: 'walking',
  activityName: 'ignored',
  durationMinutes: 45,
  distanceKm: 3.456,
  steps: 5200,
  intensity: 'moderate',
  heartRateAverage: 112,
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

describe('normalizeCardioDraft (README §11.1)', () => {
  it('rounds distance, drops the name of standard activities and blank notes', () => {
    expect(normalizeCardioDraft(walk, today)).toEqual({
      ...walk,
      activityName: null,
      distanceKm: 3.46,
      notes: null,
    });
  });

  it('needs a name for custom activities', () => {
    const custom = { ...walk, activityType: 'custom' as const };
    expect(normalizeCardioDraft({ ...custom, activityName: ' Remo ' }, today).activityName).toBe(
      'Remo',
    );
    expect(code(() => normalizeCardioDraft({ ...custom, activityName: '' }, today))).toBe(
      'cardio.activity_name_required',
    );
  });

  it('rejects the future and values out of range', () => {
    expect(code(() => normalizeCardioDraft({ ...walk, sessionDate: '2026-10-27' }, today))).toBe(
      'cardio.date_in_future',
    );
    expect(code(() => normalizeCardioDraft({ ...walk, durationMinutes: 0 }, today))).toBe(
      'cardio.duration_out_of_range',
    );
    expect(code(() => normalizeCardioDraft({ ...walk, durationMinutes: 10.5 }, today))).toBe(
      'cardio.duration_out_of_range',
    );
    expect(code(() => normalizeCardioDraft({ ...walk, distanceKm: 301 }, today))).toBe(
      'cardio.distance_out_of_range',
    );
    expect(code(() => normalizeCardioDraft({ ...walk, heartRateAverage: 20 }, today))).toBe(
      'cardio.heart_rate_out_of_range',
    );
  });
});

describe('weeks', () => {
  it('starts weeks on Monday', () => {
    expect(weekStartOf(parseLocalDate('2026-10-26'))).toBe('2026-10-26');
    expect(weekStartOf(parseLocalDate('2026-11-01'))).toBe('2026-10-26');
    expect(weekStartOf(parseLocalDate('2026-10-25'))).toBe('2026-10-19');
  });

  it('sums the week, in total and per activity', () => {
    const s = (
      sessionDate: string,
      activityType: CardioDraft['activityType'],
      minutes: number,
      km: number | null,
    ) => ({
      sessionDate,
      activityType,
      activityName: null,
      durationMinutes: minutes,
      distanceKm: km,
    });
    const summary = weekSummary(
      [
        s('2026-10-26', 'walking', 45, 3.5),
        s('2026-10-28', 'walking', 40, 3.2),
        s('2026-10-29', 'cycling', 30, null),
        s('2026-10-25', 'walking', 60, 5), // previous week
        s('2026-11-02', 'walking', 60, 5), // next week
      ],
      parseLocalDate('2026-10-26'),
    );
    expect(summary).toEqual({
      weekStart: '2026-10-26',
      sessions: 3,
      minutes: 115,
      distanceKm: 6.7,
      byActivity: [
        { activityType: 'walking', activityName: null, sessions: 2, minutes: 85, distanceKm: 6.7 },
        { activityType: 'cycling', activityName: null, sessions: 1, minutes: 30, distanceKm: 0 },
      ],
    });
  });
});

describe('normalizeCardioTarget', () => {
  it('keeps whole numbers within range and allows clearing', () => {
    expect(normalizeCardioTarget({ sessionsPerWeek: 5, minutesPerWeek: 200 })).toEqual({
      sessionsPerWeek: 5,
      minutesPerWeek: 200,
    });
    expect(normalizeCardioTarget({ sessionsPerWeek: null, minutesPerWeek: 150 })).toEqual({
      sessionsPerWeek: null,
      minutesPerWeek: 150,
    });
    expect(normalizeCardioTarget({ sessionsPerWeek: null, minutesPerWeek: null })).toEqual({
      sessionsPerWeek: null,
      minutesPerWeek: null,
    });
  });

  it('rejects zero, fractions and values above the limits', () => {
    for (const draft of [
      { sessionsPerWeek: 0, minutesPerWeek: null },
      { sessionsPerWeek: 15, minutesPerWeek: null },
      { sessionsPerWeek: null, minutesPerWeek: 2.5 },
      { sessionsPerWeek: null, minutesPerWeek: 3001 },
    ]) {
      expect(code(() => normalizeCardioTarget(draft))).toBe('cardio_target.out_of_range');
    }
  });
});
