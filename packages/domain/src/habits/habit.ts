import { ConflictError, ValidationError } from '../errors';
import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';

/**
 * Generic habits (README §11.2): never a column per habit. Values are numbers:
 * boolean 1/0, quantity in its unit, duration in minutes, time as minutes
 * since midnight.
 */
export const HABIT_TYPES = ['boolean', 'quantity', 'duration', 'time'] as const;
export type HabitType = (typeof HABIT_TYPES)[number];

export const HABIT_NAME_MAX_LENGTH = 40;
export const HABIT_UNIT_MAX_LENGTH = 15;
export const MAX_HABIT_QUANTITY = 1_000_000;
export const MINUTES_PER_DAY = 1440;

export interface HabitDraft {
  name: string;
  type: HabitType;
  /** Only for quantity habits (e.g. "passos"). */
  unit: string | null;
  /** Quantity or minutes; never for boolean or time habits. */
  targetValue: number | null;
}

const invalid = (code: string) => new ValidationError(code, code);
const clean = (text: string) => text.trim().replace(/\s+/g, ' ');
const key = (name: string) => name.toLocaleLowerCase('pt-BR');

function target(type: HabitType, value: number | null): number | null {
  if (value === null || type === 'boolean' || type === 'time') return null;
  if (type === 'duration') {
    if (!Number.isInteger(value) || value < 1 || value > MINUTES_PER_DAY)
      throw invalid('habit.target_out_of_range');
    return value;
  }
  const rounded = Math.round(value * 100) / 100;
  if (!(rounded > 0) || rounded > MAX_HABIT_QUANTITY) throw invalid('habit.target_out_of_range');
  return rounded;
}

/** Name 1–40 characters, unique among the profile's active habits ignoring case. */
export function normalizeHabitDraft(draft: HabitDraft, otherNames: readonly string[]): HabitDraft {
  const name = clean(draft.name);
  if (!name) throw invalid('habit.name_required');
  if ([...name].length > HABIT_NAME_MAX_LENGTH) throw invalid('habit.name_too_long');
  if (otherNames.some((other) => key(other) === key(name))) {
    throw new ConflictError('habit.duplicate', 'Habit already exists');
  }
  let unit: string | null = null;
  if (draft.type === 'quantity') {
    unit = draft.unit === null ? null : clean(draft.unit) || null;
    if (unit && [...unit].length > HABIT_UNIT_MAX_LENGTH) throw invalid('habit.unit_too_long');
  }
  return { name, type: draft.type, unit, targetValue: target(draft.type, draft.targetValue) };
}

/** A day's value for the habit type; never for a future day. */
export function normalizeHabitValue(
  type: HabitType,
  value: number,
  logDate: LocalDate,
  today: LocalDate,
): number {
  if (daysBetween(logDate, today) < 0) throw invalid('habit.date_in_future');
  const ok = (min: number, max: number, whole: boolean) =>
    Number.isFinite(value) && value >= min && value <= max && (!whole || Number.isInteger(value));
  const valid = {
    boolean: value === 0 || value === 1,
    quantity: ok(0, MAX_HABIT_QUANTITY, false),
    duration: ok(0, MINUTES_PER_DAY, true),
    time: ok(0, MINUTES_PER_DAY - 1, true),
  }[type];
  if (!valid) throw invalid('habit.value_out_of_range');
  return type === 'quantity' ? Math.round(value * 100) / 100 : value;
}

/**
 * Whether a day counts as done: boolean marked; quantity or duration at or
 * above the target (or above zero without one); time registered.
 */
export function isHabitDone(
  habit: Pick<HabitDraft, 'type' | 'targetValue'>,
  value: number | null,
): boolean {
  if (value === null) return false;
  if (habit.type === 'boolean') return value === 1;
  if (habit.type === 'time') return true;
  return habit.targetValue === null ? value > 0 : value >= habit.targetValue;
}

/** The `count` days ending on `date`, oldest first. */
export function daysEndingOn(date: LocalDate | string, count: number): LocalDate[] {
  const end = parseLocalDate(date);
  return Array.from({ length: count }, (_, i) => addDaysToLocalDate(end, i - count + 1));
}

/** Starter habits from README §11.2 that no other module covers. */
export const HABIT_EXAMPLES: readonly HabitDraft[] = [
  { name: 'Creatina', type: 'boolean', unit: null, targetValue: null },
  { name: 'Passos', type: 'quantity', unit: 'passos', targetValue: 8000 },
];

/** The habit that holds the day's steps: a quantity in "passos" (README §13.2). */
export function isStepsHabit(habit: { type: HabitType; unit: string | null }): boolean {
  return habit.type === 'quantity' && habit.unit?.trim().toLocaleLowerCase('pt-BR') === 'passos';
}
