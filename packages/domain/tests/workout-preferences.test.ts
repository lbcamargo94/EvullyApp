import { describe, expect, it } from 'vitest';
import {
  EMPTY_WORKOUT_PREFERENCES,
  normalizeWorkoutPreferences,
  suggestPlanTemplates,
  ValidationError,
  type WorkoutPreferences,
} from '../src';

const prefs = (p: Partial<WorkoutPreferences>): WorkoutPreferences => ({
  ...EMPTY_WORKOUT_PREFERENCES,
  ...p,
});

describe('normalizeWorkoutPreferences', () => {
  it('orders equipment and drops "none" when something else is chosen', () => {
    expect(
      normalizeWorkoutPreferences(prefs({ equipment: ['bench', 'none', 'barbell', 'bench'] }))
        .equipment,
    ).toEqual(['barbell', 'bench']);
    expect(normalizeWorkoutPreferences(prefs({ equipment: ['none'] })).equipment).toEqual(['none']);
  });

  it('accepts 1–7 days', () => {
    expect(() => normalizeWorkoutPreferences(prefs({ daysPerWeek: 0 }))).toThrow(ValidationError);
    expect(() => normalizeWorkoutPreferences(prefs({ daysPerWeek: 8 }))).toThrow(ValidationError);
    expect(normalizeWorkoutPreferences(prefs({ daysPerWeek: 5 })).daysPerWeek).toBe(5);
  });
});

describe('suggestPlanTemplates (workout-rules@1)', () => {
  const codes = (p: Partial<WorkoutPreferences>) => {
    const s = suggestPlanTemplates(prefs(p));
    return [s.templates.map((t) => `${t.template}:${t.reason}`), s.buildOwnPlan];
  };

  it('suggests Cutting 2026 at the gym with 5+ days, plus core as a complement', () => {
    expect(codes({ location: 'gym', daysPerWeek: 5 })).toEqual([
      ['cutting_2026:gym_five_days', 'core_home:core_complement'],
      false,
    ]);
  });

  it('suggests building an own plan at the gym with fewer days', () => {
    expect(codes({ location: 'gym', daysPerWeek: 3 })).toEqual([
      ['core_home:core_complement'],
      true,
    ]);
  });

  it('suggests core at home, and both plans when training in both places', () => {
    expect(codes({ location: 'home', daysPerWeek: 3 })).toEqual([['core_home:home_core'], false]);
    expect(codes({ location: 'both', daysPerWeek: 6 })).toEqual([
      ['cutting_2026:gym_five_days', 'core_home:home_core'],
      false,
    ]);
  });

  it('suggests nothing without answers', () => {
    expect(codes({})).toEqual([[], false]);
  });
});
