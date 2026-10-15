import { describe, expect, it } from 'vitest';
import { measurementTypeStats, normalizeMeasurementDraft, parseLocalDate } from '../src';

const d = parseLocalDate;
const v = (date: string, valueCm: number, time = '07:00') => ({
  measuredOn: d(date),
  measuredAt: `${date}T${time}:00.000Z`,
  valueCm,
});

describe('measurementTypeStats (README §7.3)', () => {
  it('uses the latest value and the first one within the project', () => {
    const stats = measurementTypeStats(
      [v('2026-10-19', 93.4), v('2026-10-01', 97), v('2026-10-05', 96), v('2026-10-12', 94.6)],
      d('2026-10-05'),
    );
    expect(stats.current).toEqual({ date: '2026-10-19', valueCm: 93.4 });
    expect(stats.start).toEqual({ date: '2026-10-05', valueCm: 96 });
    expect(stats.change).toBe(-2.6);
    expect(stats.series.map((p) => p.date)).toEqual([
      '2026-10-01',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
    ]);
  });

  it('uses the first value ever without a project', () => {
    expect(measurementTypeStats([v('2026-10-05', 96), v('2026-10-01', 97)], null).start).toEqual({
      date: '2026-10-01',
      valueCm: 97,
    });
  });

  it('keeps the latest value of a day', () => {
    const stats = measurementTypeStats(
      [v('2026-10-05', 96, '07:00'), v('2026-10-05', 95.5, '21:00')],
      null,
    );
    expect(stats.series).toEqual([{ date: '2026-10-05', valueCm: 95.5 }]);
    expect(stats.change).toBe(0);
  });

  it('returns nulls without values or without values since the start', () => {
    expect(measurementTypeStats([], null)).toEqual({
      current: null,
      start: null,
      change: null,
      series: [],
    });
    const before = measurementTypeStats([v('2026-10-01', 97)], d('2026-10-05'));
    expect(before.start).toBeNull();
    expect(before.change).toBeNull();
  });
});

describe('normalizeMeasurementDraft', () => {
  const today = d('2026-10-14');
  const draft = {
    measuredOn: '2026-10-14',
    measuredAt: '2026-10-14T07:00:00.000Z',
    values: [
      { measurementTypeId: 'waist', valueCm: 93.44 },
      { measurementTypeId: 'hips', valueCm: 108.06 },
    ],
    notes: null,
  };

  it('rounds values to one decimal', () => {
    expect(normalizeMeasurementDraft(draft, today).values).toEqual([
      { measurementTypeId: 'waist', valueCm: 93.4 },
      { measurementTypeId: 'hips', valueCm: 108.1 },
    ]);
  });

  it.each([
    [{ values: [] }, 'measurement.empty'],
    [{ measuredOn: '2026-10-15' }, 'measurement.date_in_future'],
    [{ values: [{ measurementTypeId: 'waist', valueCm: 4.9 }] }, 'measurement.out_of_range'],
    [{ values: [{ measurementTypeId: 'waist', valueCm: 300.1 }] }, 'measurement.out_of_range'],
    [
      {
        values: [
          { measurementTypeId: 'waist', valueCm: 90 },
          { measurementTypeId: 'waist', valueCm: 91 },
        ],
      },
      'measurement.duplicate_type',
    ],
    [{ notes: 'a'.repeat(281) }, 'measurement.notes_too_long'],
  ])('rejects %o', (overrides, code) => {
    expect(() => normalizeMeasurementDraft({ ...draft, ...overrides }, today)).toThrow(
      expect.objectContaining({ code }),
    );
  });
});
