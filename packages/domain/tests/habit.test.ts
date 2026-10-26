import { describe, expect, it } from 'vitest';
import {
  ConflictError,
  daysEndingOn,
  HABIT_EXAMPLES,
  isHabitDone,
  normalizeHabitDraft,
  normalizeHabitValue,
  parseLocalDate,
  ValidationError,
} from '../src';

const today = parseLocalDate('2026-10-26');
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as ValidationError).code;
  }
  return null;
};

describe('normalizeHabitDraft (README §11.2)', () => {
  it('keeps unit and target only where they make sense', () => {
    expect(
      normalizeHabitDraft(
        { name: ' Passos ', type: 'quantity', unit: ' passos ', targetValue: 8000 },
        [],
      ),
    ).toEqual({
      name: 'Passos',
      type: 'quantity',
      unit: 'passos',
      targetValue: 8000,
    });
    expect(
      normalizeHabitDraft({ name: 'Creatina', type: 'boolean', unit: 'g', targetValue: 5 }, []),
    ).toEqual({
      name: 'Creatina',
      type: 'boolean',
      unit: null,
      targetValue: null,
    });
    expect(
      normalizeHabitDraft({ name: 'Leitura', type: 'duration', unit: null, targetValue: 30 }, [])
        .targetValue,
    ).toBe(30);
  });

  it('rejects duplicates and invalid targets', () => {
    expect(() =>
      normalizeHabitDraft({ name: 'PASSOS', type: 'quantity', unit: null, targetValue: null }, [
        'Passos',
      ]),
    ).toThrow(ConflictError);
    expect(
      code(() =>
        normalizeHabitDraft({ name: 'X', type: 'duration', unit: null, targetValue: 1441 }, []),
      ),
    ).toBe('habit.target_out_of_range');
    expect(
      code(() =>
        normalizeHabitDraft({ name: ' ', type: 'boolean', unit: null, targetValue: null }, []),
      ),
    ).toBe('habit.name_required');
  });
});

describe('normalizeHabitValue', () => {
  it('validates each type and never a future day', () => {
    expect(normalizeHabitValue('boolean', 1, today, today)).toBe(1);
    expect(normalizeHabitValue('quantity', 8123.456, today, today)).toBe(8123.46);
    expect(normalizeHabitValue('time', 23 * 60, today, today)).toBe(1380);
    expect(code(() => normalizeHabitValue('boolean', 2, today, today))).toBe(
      'habit.value_out_of_range',
    );
    expect(code(() => normalizeHabitValue('duration', 30.5, today, today))).toBe(
      'habit.value_out_of_range',
    );
    expect(code(() => normalizeHabitValue('time', 1440, today, today))).toBe(
      'habit.value_out_of_range',
    );
    expect(code(() => normalizeHabitValue('boolean', 1, parseLocalDate('2026-10-27'), today))).toBe(
      'habit.date_in_future',
    );
  });
});

describe('isHabitDone', () => {
  it('follows the type and the target', () => {
    expect(isHabitDone({ type: 'boolean', targetValue: null }, 1)).toBe(true);
    expect(isHabitDone({ type: 'boolean', targetValue: null }, 0)).toBe(false);
    expect(isHabitDone({ type: 'quantity', targetValue: 8000 }, 7999)).toBe(false);
    expect(isHabitDone({ type: 'quantity', targetValue: 8000 }, 8000)).toBe(true);
    expect(isHabitDone({ type: 'duration', targetValue: null }, 10)).toBe(true);
    expect(isHabitDone({ type: 'time', targetValue: null }, 0)).toBe(true);
    expect(isHabitDone({ type: 'time', targetValue: null }, null)).toBe(false);
  });
});

describe('daysEndingOn and examples', () => {
  it('lists the last days oldest first', () => {
    expect(daysEndingOn('2026-10-02', 3)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('ships valid examples', () => {
    for (const habit of HABIT_EXAMPLES) expect(() => normalizeHabitDraft(habit, [])).not.toThrow();
  });
});
