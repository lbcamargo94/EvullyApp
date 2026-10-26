import { ConflictError, ValidationError } from '../errors';

export type TargetType = 'reps' | 'seconds';

/** How an exercise is prescribed in a plan (README §10.3). */
export interface Prescription {
  sets: number;
  targetType: TargetType;
  minReps: number | null;
  maxReps: number | null;
  minSeconds: number | null;
  maxSeconds: number | null;
  perSide: boolean;
  minRir: number | null;
  maxRir: number | null;
  minRestSeconds: number | null;
  maxRestSeconds: number | null;
  notes: string | null;
}

export const PLAN_NAME_MAX_LENGTH = 60;
export const DAY_NAME_MAX_LENGTH = 40;
export const PRESCRIPTION_NOTES_MAX_LENGTH = 200;

const invalid = (code: string) => new ValidationError(code, code);
const clean = (text: string) => text.trim().replace(/\s+/g, ' ');

function whole(value: number, min: number, max: number, code: string): number {
  if (!Number.isInteger(value) || value < min || value > max) throw invalid(code);
  return value;
}

/**
 * A min–max pair. Both missing = not prescribed; one missing takes the other
 * (a fixed value); min may not exceed max.
 */
function range(
  min: number | null,
  max: number | null,
  limits: [number, number],
  code: string,
): [number | null, number | null] {
  if (min === null && max === null) return [null, null];
  const low = whole(min ?? (max as number), limits[0], limits[1], code);
  const high = whole(max ?? (min as number), limits[0], limits[1], code);
  if (low > high) throw invalid(code);
  return [low, high];
}

/** Validates a prescription; the pair that does not match the target type is cleared. */
export function normalizePrescription(p: Prescription): Prescription {
  const sets = whole(p.sets, 1, 20, 'prescription.sets_out_of_range');
  const reps =
    p.targetType === 'reps'
      ? range(p.minReps, p.maxReps, [1, 100], 'prescription.reps_out_of_range')
      : [null, null];
  const seconds =
    p.targetType === 'seconds'
      ? range(p.minSeconds, p.maxSeconds, [1, 3600], 'prescription.seconds_out_of_range')
      : [null, null];
  if (reps[0] === null && seconds[0] === null) throw invalid('prescription.target_required');
  const rir = range(p.minRir, p.maxRir, [0, 10], 'prescription.rir_out_of_range');
  const rest = range(
    p.minRestSeconds,
    p.maxRestSeconds,
    [0, 900],
    'prescription.rest_out_of_range',
  );
  const notes = p.notes === null ? null : clean(p.notes) || null;
  if (notes && [...notes].length > PRESCRIPTION_NOTES_MAX_LENGTH) {
    throw invalid('prescription.notes_too_long');
  }
  return {
    sets,
    targetType: p.targetType,
    minReps: reps[0],
    maxReps: reps[1],
    minSeconds: seconds[0],
    maxSeconds: seconds[1],
    perSide: p.perSide,
    minRir: rir[0],
    maxRir: rir[1],
    minRestSeconds: rest[0],
    maxRestSeconds: rest[1],
    notes,
  };
}

const key = (name: string) => name.toLocaleLowerCase('pt-BR');

/** Plan name: 1–60 characters, unique among the profile's plans ignoring case. */
export function normalizePlanName(name: string, otherNames: readonly string[]): string {
  const normalized = clean(name);
  if (!normalized) throw invalid('workout_plan.name_required');
  if ([...normalized].length > PLAN_NAME_MAX_LENGTH) throw invalid('workout_plan.name_too_long');
  if (otherNames.some((other) => key(other) === key(normalized))) {
    throw new ConflictError('workout_plan.duplicate', 'Plan already exists');
  }
  return normalized;
}

/** Name for an imported plan: the template name, or "Name (2)", "(3)"… when taken. */
export function availablePlanName(name: string, takenNames: readonly string[]): string {
  const taken = new Set(takenNames.map(key));
  if (!taken.has(key(name))) return name;
  for (let n = 2; ; n++) {
    const candidate = `${name} (${n})`;
    if (!taken.has(key(candidate))) return candidate;
  }
}

/** Workout day: 1–40 characters; weekday 1 (Monday) to 7 (Sunday) or none. */
export function normalizeWorkoutDay(day: { name: string; weekday: number | null }) {
  const name = clean(day.name);
  if (!name) throw invalid('workout_day.name_required');
  if ([...name].length > DAY_NAME_MAX_LENGTH) throw invalid('workout_day.name_too_long');
  const weekday =
    day.weekday === null ? null : whole(day.weekday, 1, 7, 'workout_day.invalid_weekday');
  return { name, weekday };
}

/** Moves one id one position up or down; unchanged at the edges. */
export function moveInOrder(
  ids: readonly string[],
  id: string,
  direction: 'up' | 'down',
): string[] {
  const order = [...ids];
  const index = order.indexOf(id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= order.length) return order;
  [order[index], order[target]] = [order[target] as string, order[index] as string];
  return order;
}
