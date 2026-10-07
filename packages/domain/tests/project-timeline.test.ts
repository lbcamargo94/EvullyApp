import { describe, expect, it } from 'vitest';
import { ValidationError, parseLocalDate, projectTimeline } from '../src';

const d = parseLocalDate;
const start = d('2026-10-05');
const target = d('2026-12-06');

describe('projectTimeline', () => {
  it('counts the start date as day 1 of 63', () => {
    expect(projectTimeline(start, target, start)).toEqual({
      status: 'in_progress',
      day: 1,
      totalDays: 63,
      daysLeft: 62,
    });
  });

  it('matches the dashboard example: day 18 with 45 days left', () => {
    expect(projectTimeline(start, target, d('2026-10-22'))).toMatchObject({
      day: 18,
      daysLeft: 45,
    });
  });

  it('is on the last day at the target date', () => {
    expect(projectTimeline(start, target, target)).toMatchObject({ day: 63, daysLeft: 0 });
  });

  it('reports days until start before the project begins', () => {
    expect(projectTimeline(start, target, d('2026-10-01'))).toEqual({
      status: 'not_started',
      totalDays: 63,
      daysUntilStart: 4,
    });
  });

  it('reports days since the end after the target date', () => {
    expect(projectTimeline(start, target, d('2026-12-10'))).toEqual({
      status: 'ended',
      totalDays: 63,
      daysSinceEnd: 4,
    });
  });

  it('rejects a target before the start', () => {
    expect(() => projectTimeline(target, start, start)).toThrow(ValidationError);
  });
});

describe('parseLocalDate', () => {
  it.each(['2026-10-5', '05/10/2026', '2026-13-01', '2026-09-31', '2026-02-29'])(
    'rejects %s',
    (value) => {
      expect(() => d(value)).toThrow(ValidationError);
    },
  );

  it('accepts a leap day', () => {
    expect(d('2028-02-29')).toBe('2028-02-29');
  });
});
