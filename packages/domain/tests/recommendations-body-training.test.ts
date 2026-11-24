import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  evaluateRules,
  parseLocalDate,
  type RuleInputs,
  type StatPoint,
  type TrainingSession,
} from '../src';

// A Tuesday.
const today = parseLocalDate('2026-11-24');
const ago = (days: number) => addDaysToLocalDate(today, -days);
const none: RuleInputs = {
  lastWeighing: null,
  lastMeasurement: null,
  progressions: [],
  weights: [],
  objective: null,
  rateBand: null,
  sessions: [],
  plans: [],
};
/** One weighing a day for 30 days: `at(daysAgo)` kg. */
const daily = (at: (daysAgo: number) => number): StatPoint[] =>
  Array.from({ length: 30 }, (_, i) => ({ date: ago(29 - i), value: at(29 - i) }));
const workout = (daysAgo: number, volumeKg: number): TrainingSession => ({
  date: ago(daysAgo),
  exercises: [
    {
      exerciseId: 'ex',
      name: 'Supino',
      muscleGroup: 'chest',
      volumeKg,
      completedSets: 3,
      loadedSets: [],
    },
  ],
});

describe('weight_plateau (README §20.2)', () => {
  const flat = daily((d) => 80 + (d % 2) * 0.1);

  it('flags a 7-day average that moved under 0.2 kg in 21 days, while losing or gaining', () => {
    const [signal] = evaluateRules({ ...none, weights: flat, objective: 'fat_loss' }, today);
    expect(signal).toMatchObject({
      ruleId: 'weight_plateau',
      subjectKey: 'weight',
      evidence: { objective: 'fat_loss', days: 21, limitKg: 0.2 },
    });
    const change = signal?.ruleId === 'weight_plateau' ? signal.evidence.changeKg : 1;
    expect(Math.abs(change)).toBeLessThan(0.2);
  });

  it('stays quiet for maintenance, without a project, or while the weight moves', () => {
    expect(evaluateRules({ ...none, weights: flat, objective: 'maintenance' }, today)).toEqual([]);
    expect(evaluateRules({ ...none, weights: flat }, today)).toEqual([]);
    const losing = daily((d) => 80 + d * 0.05);
    expect(evaluateRules({ ...none, weights: losing, objective: 'fat_loss' }, today)).toEqual([]);
  });
});

describe('weight_rate_out_of_band', () => {
  // Losing 0.1 kg a day: −0.7 kg/week.
  const losing = daily((d) => 80 + d * 0.1);

  it('flags the 14-day pace outside the project band', () => {
    const [signal] = evaluateRules(
      { ...none, weights: losing, rateBand: { minKg: -0.5, maxKg: -0.25 } },
      today,
    );
    expect(signal).toEqual({
      ruleId: 'weight_rate_out_of_band',
      subjectKey: 'weight',
      level: 'attention',
      evidence: { days: 14, ratePerWeekKg: -0.7, minKg: -0.5, maxKg: -0.25 },
    });
  });

  it('stays quiet inside the band or without one', () => {
    const inside = { ...none, weights: losing, rateBand: { minKg: -1, maxKg: -0.5 } };
    expect(evaluateRules(inside, today)).toEqual([]);
    expect(evaluateRules({ ...none, weights: losing }, today)).toEqual([]);
  });
});

describe('volume_drop', () => {
  it('flags volume falling more than 10% in two 14-day periods in a row', () => {
    const sessions = [
      workout(40, 5000),
      workout(30, 5000),
      workout(25, 4000),
      workout(18, 4000),
      workout(10, 3500),
      workout(3, 3500),
    ];
    expect(evaluateRules({ ...none, sessions }, today)).toEqual([
      {
        ruleId: 'volume_drop',
        subjectKey: 'training',
        level: 'info',
        evidence: {
          days: 14,
          volumesKg: [10000, 8000, 7000],
          workouts: [2, 2, 2],
          limitPercent: 10,
        },
      },
    ]);
  });

  it('needs two workouts in each period and two drops', () => {
    const fewWorkouts = [workout(40, 5000), workout(25, 4000), workout(18, 4000), workout(3, 3000)];
    expect(evaluateRules({ ...none, sessions: fewWorkouts }, today)).toEqual([]);
    const oneDrop = [
      workout(40, 5000),
      workout(30, 5000),
      workout(25, 5000),
      workout(18, 5000),
      workout(10, 3000),
      workout(3, 3000),
    ];
    expect(evaluateRules({ ...none, sessions: oneDrop }, today)).toEqual([]);
  });
});

describe('low_adherence', () => {
  // Monday, Wednesday and Friday for a month: 6 planned days in the last 14.
  const plans = [{ weekdays: [1, 3, 5], since: ago(30) }];

  it('flags under 60% of the planned days done in 14 days', () => {
    const sessions = [workout(1, 1), workout(6, 1), workout(8, 1)];
    expect(evaluateRules({ ...none, plans, sessions }, today)).toEqual([
      {
        ruleId: 'low_adherence',
        subjectKey: 'training',
        level: 'info',
        evidence: { days: 14, done: 3, planned: 6, percent: 50, limitPercent: 60 },
      },
    ]);
  });

  it('stays quiet at 60% or with fewer than 4 planned days', () => {
    const four = [1, 3, 6, 8].map((d) => workout(d, 1));
    expect(evaluateRules({ ...none, plans, sessions: four }, today)).toEqual([]);
    const newPlan = [{ weekdays: [1, 3, 5], since: ago(5) }];
    expect(evaluateRules({ ...none, plans: newPlan }, today)).toEqual([]);
  });
});
