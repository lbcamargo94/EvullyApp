import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  evaluateRules,
  parseLocalDate,
  type MeasurementSeries,
  type RuleInputs,
} from '../src';

const today = parseLocalDate('2026-11-24');
const ago = (days: number) => addDaysToLocalDate(today, -days);
const inputs = (measurements: RuleInputs['measurements']): RuleInputs => ({
  lastWeighing: null,
  lastMeasurement: null,
  progressions: [],
  weights: [],
  objective: null,
  rateBand: null,
  sessions: [],
  plans: [],
  measurements,
});
const series = (code: string, name: string, values: [daysAgo: number, cm: number][]) =>
  ({
    code,
    name,
    points: values.map(([d, value]) => ({ date: ago(d), value })),
  }) satisfies MeasurementSeries;
const hips = { code: 'hips', name: 'Quadril' };

describe('tracking_suggestion (README §20.2)', () => {
  it('suggests hips when the waist moved under 0.5 cm in 28 days', () => {
    const waist = series('waist', 'Cintura', [
      [20, 82.3],
      [13, 82.1],
      [3, 82.4],
      [30, 90],
    ]);
    expect(evaluateRules(inputs({ tracked: [waist], untracked: [hips] }), today)).toEqual([
      {
        ruleId: 'tracking_suggestion',
        subjectKey: 'hips',
        level: 'info',
        evidence: {
          sourceCode: 'waist',
          sourceName: 'Cintura',
          suggestedCode: 'hips',
          suggestedName: 'Quadril',
          firstDate: ago(20),
          lastDate: ago(3),
          values: 3,
          changeCm: 0.3,
          days: 28,
          minSpanDays: 14,
          limitCm: 0.5,
        },
      },
    ]);
  });

  it('suggests one measurement once, from the first stable pair', () => {
    const stable: [number, number][] = [
      [18, 80],
      [2, 80.2],
    ];
    const signals = evaluateRules(
      inputs({
        tracked: [series('abdomen', 'Abdômen', stable), series('waist', 'Cintura', stable)],
        untracked: [hips],
      }),
      today,
    );
    expect(signals.map((s) => s.ruleId === 'tracking_suggestion' && s.evidence.sourceCode)).toEqual(
      ['waist'],
    );
  });

  it('stays quiet when it moved, spans under 14 days, or the pair is tracked already', () => {
    const moved = series('waist', 'Cintura', [
      [20, 83],
      [3, 82.4],
    ]);
    const short = series('waist', 'Cintura', [
      [10, 82],
      [3, 82],
    ]);
    const steady = series('waist', 'Cintura', [
      [20, 82],
      [3, 82],
    ]);
    expect(evaluateRules(inputs({ tracked: [moved], untracked: [hips] }), today)).toEqual([]);
    expect(evaluateRules(inputs({ tracked: [short], untracked: [hips] }), today)).toEqual([]);
    expect(evaluateRules(inputs({ tracked: [steady], untracked: [] }), today)).toEqual([]);
  });
});
