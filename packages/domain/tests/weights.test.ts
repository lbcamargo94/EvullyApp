import { describe, expect, it } from 'vitest';
import {
  dailyWeights,
  normalizeTagName,
  normalizeWeightDraft,
  parseLocalDate,
  startingWeight,
  trendAt,
  weightStats,
  type WeighingRecord,
} from '../src';

const d = parseLocalDate;
const w = (date: string, kg: number, time = '10:00', tagged = false): WeighingRecord => ({
  measuredOn: d(date),
  measuredAt: `${date}T${time}:00.000Z`,
  weightKg: kg,
  tagged,
});

describe('dailyWeights', () => {
  it('keeps the latest weighing of each day, oldest day first', () => {
    const result = dailyWeights([
      w('2026-10-06', 91.6),
      w('2026-10-05', 92.4, '07:00'),
      w('2026-10-05', 92.0, '22:00'),
    ]);
    expect(result.map((r) => [r.date, r.weightKg])).toEqual([
      ['2026-10-05', 92.0],
      ['2026-10-06', 91.6],
    ]);
  });

  it('marks a day as tagged when any weighing has a tag', () => {
    const [day] = dailyWeights([w('2026-10-05', 92, '07:00', true), w('2026-10-05', 91, '08:00')]);
    expect(day).toMatchObject({ weightKg: 91, tagged: true });
  });
});

describe('trendAt (7-day moving average)', () => {
  const daily = dailyWeights([
    w('2026-10-01', 93),
    w('2026-10-05', 92),
    w('2026-10-06', 91),
    w('2026-10-07', 90),
  ]);

  it('averages the days inside the window D−6..D', () => {
    // 2026-10-01 is exactly 6 days before 2026-10-07, so it is inside the window.
    expect(trendAt(daily, d('2026-10-07'))).toBe(91.5);
  });

  it('drops days older than D−6', () => {
    expect(trendAt(daily, d('2026-10-08'))).toBe(91);
  });

  it('needs at least 3 days with a weighing', () => {
    expect(trendAt(daily, d('2026-10-11'))).toBe(91);
    expect(trendAt(daily, d('2026-10-12'))).toBeNull();
    expect(trendAt(daily, d('2026-10-05'))).toBeNull();
  });

  it('ignores weighings after the date', () => {
    expect(trendAt(daily, d('2026-10-06'))).toBe(92);
  });
});

describe('startingWeight', () => {
  const daily = dailyWeights([w('2026-10-01', 93), w('2026-10-05', 92)]);

  it('uses the first weighing on or after the project start', () => {
    expect(startingWeight(daily, d('2026-10-05'))?.weightKg).toBe(92);
    expect(startingWeight(daily, d('2026-10-03'))?.weightKg).toBe(92);
  });

  it('uses the first weighing ever without a project', () => {
    expect(startingWeight(daily, null)?.weightKg).toBe(93);
  });

  it('is null when nothing was weighed since the start', () => {
    expect(startingWeight(daily, d('2026-10-06'))).toBeNull();
  });
});

describe('weightStats', () => {
  it('matches the dashboard example of README §8.5', () => {
    const records = [
      w('2026-10-05', 92.0),
      w('2026-10-16', 90.3),
      w('2026-10-17', 90.0),
      w('2026-10-18', 90.4),
      w('2026-10-19', 89.9),
      w('2026-10-20', 90.1),
      w('2026-10-21', 90.2),
      w('2026-10-22', 89.8),
    ];
    const stats = weightStats(records, d('2026-10-22'), d('2026-10-05'));
    expect(stats.current?.weightKg).toBe(89.8);
    expect(stats.start?.weightKg).toBe(92);
    expect(stats.change).toBe(-2.2);
    expect(stats.trend).toBe(90.1);
    expect(stats.trendChange).toBe(-1.9);
    expect(stats.series).toHaveLength(8);
    expect(stats.series[0]?.trend).toBeNull();
  });

  it('returns nulls without weighings', () => {
    expect(weightStats([], d('2026-10-22'), null)).toEqual({
      current: null,
      trend: null,
      start: null,
      change: null,
      trendChange: null,
      series: [],
    });
  });
});

describe('normalizeWeightDraft', () => {
  const today = d('2026-10-08');
  const draft = {
    measuredOn: '2026-10-08',
    measuredAt: '2026-10-08T10:00:00.000Z',
    weightKg: 89.456,
    notes: '  ',
  };

  it('rounds to 2 decimals and drops blank notes', () => {
    expect(normalizeWeightDraft(draft, today)).toMatchObject({ weightKg: 89.46, notes: null });
  });

  it('accepts past dates', () => {
    expect(normalizeWeightDraft({ ...draft, measuredOn: '2026-10-01' }, today).measuredOn).toBe(
      '2026-10-01',
    );
  });

  it.each([
    [{ measuredOn: '2026-10-09' }, 'weight.date_in_future'],
    [{ weightKg: 19.99 }, 'weight.out_of_range'],
    [{ weightKg: 400.01 }, 'weight.out_of_range'],
    [{ weightKg: Number.NaN }, 'weight.out_of_range'],
    [{ notes: 'a'.repeat(281) }, 'weight.notes_too_long'],
  ])('rejects %o', (overrides, code) => {
    expect(() => normalizeWeightDraft({ ...draft, ...overrides }, today)).toThrow(
      expect.objectContaining({ code }),
    );
  });
});

describe('normalizeTagName', () => {
  const existing = ['Retenção', 'Viagem'];

  it('trims and collapses spaces', () => {
    expect(normalizeTagName('  Pós   festa ', existing)).toBe('Pós festa');
  });

  it.each([
    ['   ', 'tag.name_required'],
    ['a'.repeat(31), 'tag.name_too_long'],
    ['viagem', 'tag.duplicate'],
    [' RETENÇÃO ', 'tag.duplicate'],
  ])('rejects %j', (name, code) => {
    expect(() => normalizeTagName(name, existing)).toThrow(expect.objectContaining({ code }));
  });
});
