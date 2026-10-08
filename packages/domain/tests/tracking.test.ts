import { describe, expect, it } from 'vitest';
import {
  asksAboutMenstrualCycle,
  buildTrackingProposal,
  changeTone,
  defaultTrackingProposal,
  effectiveAt,
  normalizeProjectDraft,
  parseLocalDate,
  type FocusArea,
  type Objective,
} from '../src';

const propose = (objective: Objective | null, focusAreas: FocusArea[]) =>
  buildTrackingProposal({ objective, focusAreas, weightDisplay: 'trend' }, 'male');

describe('buildTrackingProposal (tracking-rules@1)', () => {
  it('maps focus areas to measurements in the order chosen', () => {
    expect(propose('fat_loss', ['legs', 'waist']).measurementCodes).toEqual([
      'right_thigh',
      'left_thigh',
      'right_calf',
      'left_calf',
      'waist',
      'abdomen',
    ]);
  });

  it.each([
    ['fat_loss', false],
    ['maintenance', false],
    ['muscle_gain', true],
    ['recomposition', true],
  ] as const)('arms with %s include contracted biceps: %s', (objective, included) => {
    expect(propose(objective, ['arms']).measurementCodes.includes('right_biceps')).toBe(included);
  });

  it('tracks only the waist when no area is chosen', () => {
    expect(propose('fat_loss', []).measurementCodes).toEqual(['waist', 'abdomen']);
  });

  it('ignores repeated areas', () => {
    expect(propose(null, ['hips', 'hips']).focusAreas).toEqual(['hips']);
  });

  it('adds the cycle tag only for female profiles', () => {
    expect(defaultTrackingProposal('female').tags).toContain('Ciclo menstrual');
    expect(defaultTrackingProposal('male').tags).not.toContain('Ciclo menstrual');
    expect(defaultTrackingProposal(null).tags).toHaveLength(5);
  });

  it('defaults to waist and weight trend when skipped', () => {
    expect(defaultTrackingProposal(null)).toMatchObject({
      focusAreas: ['waist'],
      weightDisplay: 'trend',
      measurementCodes: ['waist', 'abdomen'],
    });
  });

  it('asks about the cycle unless the profile is male', () => {
    expect([asksAboutMenstrualCycle('female'), asksAboutMenstrualCycle(null)]).toEqual([
      true,
      true,
    ]);
    expect(asksAboutMenstrualCycle('male')).toBe(false);
  });
});

describe('changeTone (README §7.6)', () => {
  it.each([
    [-1.9, 'weight', 'fat_loss', 'positive'],
    [0.4, 'weight', 'fat_loss', 'caution'],
    [0.5, 'hips', 'fat_loss', 'neutral'],
    [0.5, 'hips', 'muscle_gain', 'positive'],
    [-1.5, 'waist', 'recomposition', 'positive'],
    [0.5, 'hips', 'recomposition', 'neutral'],
    [1, 'arms', 'recomposition', 'positive'],
    [-1, 'arms', 'muscle_gain', 'caution'],
    [-2, 'weight', 'maintenance', 'neutral'],
    [-2, 'other', 'muscle_gain', 'neutral'],
    [-0.05, 'waist', 'fat_loss', 'neutral'],
    [-2, 'weight', null, 'neutral'],
  ] as const)('%s on %s with %s → %s', (change, indicator, objective, tone) => {
    expect(changeTone(change, indicator, objective)).toBe(tone);
  });
});

describe('effectiveAt (README §7.5)', () => {
  const r = (effectiveFrom: string, createdAt: string) => ({
    effectiveFrom: parseLocalDate(effectiveFrom),
    createdAt,
  });
  const records = [
    r('2026-10-05', '2026-10-05T10:00:00Z'),
    r('2026-10-10', '2026-10-10T08:00:00Z'),
    r('2026-10-10', '2026-10-10T09:00:00Z'),
  ];

  it('returns null before the first record', () => {
    expect(effectiveAt(records, parseLocalDate('2026-10-04'))).toBeNull();
  });

  it('uses the latest record not after the date', () => {
    expect(effectiveAt(records, parseLocalDate('2026-10-07'))).toBe(records[0]);
  });

  it('breaks ties by the most recent creation', () => {
    expect(effectiveAt(records, parseLocalDate('2026-10-20'))).toBe(records[2]);
  });

  it('breaks exact ties by position, so the later record wins', () => {
    const same = [r('2026-10-05', '2026-10-05T10:00:00Z'), r('2026-10-05', '2026-10-05T10:00:00Z')];
    expect(effectiveAt(same, parseLocalDate('2026-10-05'))).toBe(same[1]);
  });
});

describe('normalizeProjectDraft', () => {
  const draft = {
    name: ' Shape  de Praia ',
    objective: 'fat_loss' as const,
    startDate: '2026-10-05',
    targetDate: '2026-12-06',
  };

  it('normalizes the name', () => {
    expect(normalizeProjectDraft(draft).name).toBe('Shape de Praia');
  });

  it.each([
    [{ name: '' }, 'project.name_required'],
    [{ targetDate: '2026-10-04' }, 'project.target_before_start'],
    [{ targetDate: '2062-12-06' }, 'project.too_long'],
    [{ startDate: '2026-02-30' }, 'date.invalid'],
  ])('rejects %o', (overrides, code) => {
    expect(() => normalizeProjectDraft({ ...draft, ...overrides })).toThrow(
      expect.objectContaining({ code }),
    );
  });
});
