import type { FoodLogInput, NutritionDay, SetMealConsumedInput } from '@evully/contracts';
import {
  assertCanConsume,
  dailyTotals,
  normalizeFoodLogDraft,
  normalizeLogQuantity,
  NotFoundError,
  nutrientsFor,
  parseLocalDate,
  type FoodSnapshot,
  type LocalDate,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { FoodLogRecord, FoodLogRepository } from '../ports/food-log-repository';
import type { FoodRecord, FoodRepository } from '../ports/food-repository';

export interface FoodLogDeps {
  profiles: ProfileRepository;
  foods: FoodRepository;
  logs: FoodLogRepository;
  clock: Clock;
  ids: IdGenerator;
}

const toDto = (log: FoodLogRecord): NutritionDay['logs'][number] => ({
  id: log.id,
  logDate: log.logDate,
  mealType: log.mealType,
  mealName: log.mealName,
  foodId: log.foodId,
  foodName: log.snapshot.name,
  brand: log.snapshot.brand,
  quantity: log.quantity,
  unit: log.snapshot.referenceUnit,
  nutrients: log.nutrients,
  consumedAt: log.consumedAt,
});

/** A day of food logs with its totals (README §9.5). */
export async function nutritionDay(
  { profiles, logs }: Pick<FoodLogDeps, 'profiles' | 'logs'>,
  profileId: string,
  date: LocalDate,
): Promise<NutritionDay> {
  await new GetProfile(profiles).execute({ id: profileId });
  const records = await logs.listDay(profileId, date);
  return {
    date,
    logs: records.map(toDto),
    totals: dailyTotals(records.map((r) => ({ nutrients: r.nutrients, consumed: !!r.consumedAt }))),
  };
}

/** The part of a food a log keeps (README §9.4). */
export function snapshotOf(food: FoodRecord): FoodSnapshot {
  return {
    name: food.name,
    brand: food.brand,
    referenceAmount: food.referenceAmount,
    referenceUnit: food.referenceUnit,
    caloriesKcal: food.caloriesKcal,
    proteinG: food.proteinG,
    carbohydrateG: food.carbohydrateG,
    fatG: food.fatG,
    fiberG: food.fiberG,
    sodiumMg: food.sodiumMg,
  };
}

async function findLog(logs: FoodLogRepository, profileId: string, id: string) {
  const log = await logs.findById(profileId, id);
  if (!log) throw new NotFoundError('food_log.not_found', 'Food log not found');
  return log;
}

export class GetNutritionDay {
  constructor(private readonly deps: FoodLogDeps) {}

  execute({ profileId, date }: { profileId: string; date: string }): Promise<NutritionDay> {
    return nutritionDay(this.deps, profileId, parseLocalDate(date));
  }
}

/** Adds a food to a meal, copying the food as it is now (README §9.4). */
export class AddFoodLog {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute({ profileId, foodId, ...input }: FoodLogInput): Promise<NutritionDay> {
    const { profiles, foods, logs, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const food = await foods.findById(foodId);
    if (!food) throw new NotFoundError('food.not_found', 'Food not found');
    const draft = normalizeFoodLogDraft(input, clock.today());
    const snapshot = snapshotOf(food);
    const meal = { profileId, ...draft };
    const now = clock.nowIso();
    await logs.insert({
      id: ids.next(),
      profileId,
      logDate: draft.logDate,
      mealType: draft.mealType,
      mealName: draft.mealName,
      foodId,
      snapshot,
      quantity: draft.quantity,
      nutrients: nutrientsFor(snapshot, draft.quantity),
      consumedAt: null,
      sortOrder: await logs.nextSortOrder(meal),
      createdAt: now,
      updatedAt: now,
    });
    return nutritionDay(this.deps, profileId, draft.logDate);
  }
}

/** New quantity, recalculated from the copy kept in the log, not from the current food. */
export class UpdateFoodLogQuantity {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute(input: { profileId: string; id: string; quantity: number }) {
    const { logs, clock } = this.deps;
    const log = await findLog(logs, input.profileId, input.id);
    const quantity = normalizeLogQuantity(input.quantity);
    await logs.update({
      ...log,
      quantity,
      nutrients: nutrientsFor(log.snapshot, quantity),
      updatedAt: clock.nowIso(),
    });
    return nutritionDay(this.deps, input.profileId, log.logDate);
  }
}

export class SetFoodLogConsumed {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute(input: { profileId: string; id: string; consumed: boolean }) {
    const { logs, clock } = this.deps;
    const log = await findLog(logs, input.profileId, input.id);
    if (input.consumed) assertCanConsume(log.logDate, clock.today());
    const now = clock.nowIso();
    await logs.update({
      ...log,
      consumedAt: input.consumed ? (log.consumedAt ?? now) : null,
      updatedAt: now,
    });
    return nutritionDay(this.deps, input.profileId, log.logDate);
  }
}

/** Marks every food of a meal as consumed (or not) at once. */
export class SetMealConsumed {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute({ consumed, date, ...meal }: SetMealConsumedInput) {
    const { profiles, logs, clock } = this.deps;
    await new GetProfile(profiles).execute({ id: meal.profileId });
    const logDate = parseLocalDate(date);
    if (consumed) assertCanConsume(logDate, clock.today());
    const now = clock.nowIso();
    await logs.setMealConsumed(
      { ...meal, logDate, mealName: meal.mealType === 'custom' ? meal.mealName : null },
      consumed ? now : null,
      now,
    );
    return nutritionDay(this.deps, meal.profileId, logDate);
  }
}

export class RemoveFoodLog {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }) {
    const { logs, clock } = this.deps;
    const log = await findLog(logs, profileId, id);
    await logs.softDelete(profileId, id, clock.nowIso());
    return nutritionDay(this.deps, profileId, log.logDate);
  }
}
