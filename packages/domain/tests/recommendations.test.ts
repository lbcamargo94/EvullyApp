import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  applyDecision,
  evaluateRules,
  parseLocalDate,
  reconcileSignals,
  type Prescription,
  type ProgressionCandidate,
  type RuleInputs,
  type StoredSignal,
} from '../src';

const today = parseLocalDate('2026-11-24');
const ago = (days: number) => addDaysToLocalDate(today, -days);

const prescription: Prescription = {
  sets: 2,
  targetType: 'reps',
  minReps: 8,
  maxReps: 12,
  minSeconds: null,
  maxSeconds: null,
  perSide: false,
  minRir: null,
  maxRir: null,
  minRestSeconds: null,
  maxRestSeconds: null,
  notes: null,
};
const set = (repetitions: number, completed = true) => ({
  weightKg: 40,
  repetitions,
  durationSeconds: null,
  rir: null,
  completed,
});
const candidate = (reps: number[]): ProgressionCandidate => ({
  planExerciseId: 'pe-1',
  exerciseId: 'ex-1',
  exerciseName: 'Supino reto',
  prescription,
  last: { date: ago(2), sets: reps.map((r) => set(r)) },
  incrementKg: 2.5,
});
const none: RuleInputs = { lastWeighing: null, lastMeasurement: null, progressions: [] };

describe('evaluateRules (README §20.2)', () => {
  it('stays quiet without records: a missing record needs an earlier one', () => {
    expect(evaluateRules(none, today)).toEqual([]);
  });

  it('flags 7 days without a weighing and 21 without measurements', () => {
    const signals = evaluateRules(
      { ...none, lastWeighing: ago(7), lastMeasurement: ago(20) },
      today,
    );
    expect(signals).toEqual([
      {
        ruleId: 'weight_missing',
        subjectKey: 'weight',
        level: 'info',
        evidence: { lastDate: ago(7), daysSince: 7, limitDays: 7 },
      },
    ]);
    expect(evaluateRules({ ...none, lastMeasurement: ago(21) }, today)[0]?.ruleId).toBe(
      'measurements_missing',
    );
  });

  it('flags an exercise that met the double progression, with the measured sets', () => {
    const [signal] = evaluateRules({ ...none, progressions: [candidate([12, 12])] }, today);
    expect(signal).toEqual({
      ruleId: 'double_progression',
      subjectKey: 'pe-1',
      level: 'info',
      evidence: {
        exerciseId: 'ex-1',
        exerciseName: 'Supino reto',
        lastDate: ago(2),
        targetType: 'reps',
        sets: 2,
        top: 12,
        values: [12, 12],
        incrementKg: 2.5,
      },
    });
    expect(evaluateRules({ ...none, progressions: [candidate([12, 11])] }, today)).toEqual([]);
  });

  it('needs a load: no load suggestion for bodyweight sets', () => {
    const bodyweight = candidate([12, 12]);
    const sets = (bodyweight.last?.sets ?? []).map((s) => ({ ...s, weightKg: null }));
    const progressions = [{ ...bodyweight, last: { date: ago(2), sets } }];
    expect(evaluateRules({ ...none, progressions }, today)).toEqual([]);
  });

  it('skips the rules the profile turned off', () => {
    const inputs = { ...none, lastWeighing: ago(30), progressions: [candidate([12, 12])] };
    expect(evaluateRules(inputs, today, ['weight_missing', 'double_progression'])).toEqual([]);
  });
});

describe('reconcileSignals', () => {
  const [weight] = evaluateRules({ ...none, lastWeighing: ago(9) }, today);
  const stored = (
    status: StoredSignal['status'],
    statusOn: string,
    snoozedUntil: string | null = null,
  ): StoredSignal => ({
    id: 's-1',
    ruleId: 'weight_missing',
    subjectKey: 'weight',
    status,
    statusOn,
    snoozedUntil,
  });
  const signals = weight ? [weight] : [];

  it('creates a new signal once and never repeats an open one', () => {
    expect(reconcileSignals([], signals, today).create).toEqual(signals);
    expect(reconcileSignals([stored('open', ago(1))], signals, today)).toEqual({
      create: [],
      resolve: [],
      reopen: [],
    });
  });

  it('brings a snoozed signal back on its date', () => {
    expect(
      reconcileSignals([stored('snoozed', ago(3), addDaysToLocalDate(today, 1))], signals, today)
        .reopen,
    ).toEqual([]);
    expect(reconcileSignals([stored('snoozed', ago(7), today)], signals, today).reopen).toEqual([
      's-1',
    ]);
  });

  it('keeps a dismissed signal quiet for 14 days', () => {
    expect(reconcileSignals([stored('dismissed', ago(13))], signals, today).create).toEqual([]);
    expect(reconcileSignals([stored('dismissed', ago(14))], signals, today).create).toEqual(
      signals,
    );
  });

  it('resolves open and snoozed signals that no longer hold', () => {
    expect(reconcileSignals([stored('open', ago(5))], [], today).resolve).toEqual(['s-1']);
    expect(reconcileSignals([stored('dismissed', ago(5))], [], today).resolve).toEqual([]);
  });

  it('raises a signal again after it was resolved', () => {
    expect(reconcileSignals([stored('resolved', ago(1))], signals, today).create).toEqual(signals);
  });
});

describe('applyDecision', () => {
  it('snoozes for 7 days; dismissing clears the date', () => {
    expect(applyDecision('snoozed', today)).toEqual({
      status: 'snoozed',
      snoozedUntil: addDaysToLocalDate(today, 7),
    });
    expect(applyDecision('dismissed', today)).toEqual({ status: 'dismissed', snoozedUntil: null });
  });
});
