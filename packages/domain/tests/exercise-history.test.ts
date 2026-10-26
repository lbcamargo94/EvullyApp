import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  exerciseHistory,
  parseLocalDate,
  suggestsLoadIncrease,
  type Prescription,
} from '../src';

const set = (
  setNumber: number,
  weightKg: number | null,
  repetitions: number | null,
  rir: number | null = null,
) => ({
  setNumber,
  weightKg,
  repetitions,
  durationSeconds: null,
  rir,
  completed: true,
});

const bench: Prescription = {
  sets: 3,
  targetType: 'reps',
  minReps: 6,
  maxReps: 8,
  minSeconds: null,
  maxSeconds: null,
  perSide: false,
  minRir: 1,
  maxRir: 2,
  minRestSeconds: null,
  maxRestSeconds: null,
  notes: null,
};

describe('exerciseHistory (README §10.5)', () => {
  const sessions = [
    {
      sessionId: 'c',
      startedAt: '2026-10-24T18:00:00.000Z',
      sets: [set(1, 92.5, 6), set(2, 90, 8)],
    },
    {
      sessionId: 'b',
      startedAt: '2026-10-17T18:00:00.000Z',
      sets: [set(1, 92.5, 7), set(2, 90, 8)],
    },
    {
      sessionId: 'a',
      startedAt: '2026-09-01T18:00:00.000Z',
      sets: [set(1, 80, 10), { ...set(2, 100, 1), completed: false }],
    },
  ];

  it('computes top load, volume, best load, best set and recent sessions', () => {
    const history = exerciseHistory(sessions, '2026-09-28T03:00:00.000Z');
    expect(history.sessions.map((s) => [s.sessionId, s.topWeightKg, s.volumeKg])).toEqual([
      ['c', 92.5, 1275],
      ['b', 92.5, 1367.5],
      ['a', 80, 800],
    ]);
    expect(history.bestLoad).toEqual({ weightKg: 92.5, startedAt: '2026-10-24T18:00:00.000Z' });
    // Same load: more reps wins (7 reps on 2026-10-17); uncompleted sets never count.
    expect(history.bestSet).toEqual({
      weightKg: 92.5,
      repetitions: 7,
      startedAt: '2026-10-17T18:00:00.000Z',
    });
    expect(history.recentSessions).toBe(2);
  });

  it('is empty without sessions or loads', () => {
    expect(exerciseHistory([], '2026-01-01T00:00:00.000Z')).toEqual({
      sessions: [],
      bestLoad: null,
      bestSet: null,
      recentSessions: 0,
    });
    const plank = exerciseHistory(
      [{ sessionId: 'p', startedAt: '2026-10-01T00:00:00.000Z', sets: [set(1, null, null)] }],
      '2026-01-01T00:00:00.000Z',
    );
    expect(plank.sessions[0]).toMatchObject({ topWeightKg: null, volumeKg: 0 });
  });
});

describe('suggestsLoadIncrease (README §10.6)', () => {
  it('suggests when every set hit the top of the range with RIR inside it', () => {
    expect(
      suggestsLoadIncrease(bench, [set(1, 90, 8, 2), set(2, 90, 8, 1), set(3, 90, 9, 1)]),
    ).toBe(true);
  });

  it('does not suggest below the top, with RIR outside the range or missing sets', () => {
    expect(
      suggestsLoadIncrease(bench, [set(1, 90, 8, 2), set(2, 90, 8, 2), set(3, 90, 7, 1)]),
    ).toBe(false);
    expect(
      suggestsLoadIncrease(bench, [set(1, 90, 8, 3), set(2, 90, 8, 2), set(3, 90, 8, 2)]),
    ).toBe(false);
    expect(suggestsLoadIncrease(bench, [set(1, 90, 8, 2), set(2, 90, 8, 2)])).toBe(false);
    expect(
      suggestsLoadIncrease(bench, [
        set(1, 90, 8, 2),
        set(2, 90, 8, 2),
        { ...set(3, 90, 8, 2), completed: false },
      ]),
    ).toBe(false);
  });

  it('ignores RIR when none is prescribed and works with seconds', () => {
    const noRir = { ...bench, minRir: null, maxRir: null };
    expect(suggestsLoadIncrease(noRir, [set(1, 90, 8), set(2, 90, 8), set(3, 90, 8)])).toBe(true);
    const plank = {
      ...noRir,
      sets: 2,
      targetType: 'seconds' as const,
      minReps: null,
      maxReps: null,
      minSeconds: 30,
      maxSeconds: 45,
    };
    const timed = (s: number) => ({
      weightKg: null,
      repetitions: null,
      durationSeconds: s,
      rir: null,
      completed: true,
    });
    expect(suggestsLoadIncrease(plank, [timed(45), timed(50)])).toBe(true);
    expect(suggestsLoadIncrease(plank, [timed(45), timed(40)])).toBe(false);
  });
});

describe('addDaysToLocalDate', () => {
  it('moves across months', () => {
    expect(addDaysToLocalDate(parseLocalDate('2026-10-26'), -27)).toBe('2026-09-29');
  });
});
