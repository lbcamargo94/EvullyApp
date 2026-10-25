import type { FoodSnapshot, LocalDate } from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, FoodLogsTable } from '../../../database/schema';
import type { FoodLogRecord, FoodLogRepository, MealRef } from '../ports/food-log-repository';

const toRecord = (r: Selectable<FoodLogsTable>): FoodLogRecord => ({
  id: r.id,
  profileId: r.profile_id,
  logDate: r.log_date as LocalDate,
  mealType: r.meal_type,
  mealName: r.meal_name,
  foodId: r.food_id,
  snapshot: JSON.parse(r.food_snapshot) as FoodSnapshot,
  quantity: r.quantity,
  nutrients: {
    caloriesKcal: r.calories_kcal,
    proteinG: r.protein_g,
    carbohydrateG: r.carbohydrate_g,
    fatG: r.fat_g,
    fiberG: r.fiber_g,
    sodiumMg: r.sodium_mg,
  },
  consumedAt: r.consumed_at,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const nutrientColumns = (log: FoodLogRecord) => ({
  quantity: log.quantity,
  calories_kcal: log.nutrients.caloriesKcal,
  protein_g: log.nutrients.proteinG,
  carbohydrate_g: log.nutrients.carbohydrateG,
  fat_g: log.nutrients.fatG,
  fiber_g: log.nutrients.fiberG,
  sodium_mg: log.nutrients.sodiumMg,
  consumed_at: log.consumedAt,
  updated_at: log.updatedAt,
});

export class KyselyFoodLogRepository implements FoodLogRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private active(profileId: string) {
    return this.db
      .selectFrom('food_logs')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
  }

  private meal(meal: MealRef) {
    return this.active(meal.profileId)
      .where('log_date', '=', meal.logDate)
      .where('meal_type', '=', meal.mealType)
      .where((eb) =>
        meal.mealName === null ? eb('meal_name', 'is', null) : eb('meal_name', '=', meal.mealName),
      );
  }

  async listDay(profileId: string, date: LocalDate): Promise<FoodLogRecord[]> {
    const rows = await this.active(profileId)
      .where('log_date', '=', date)
      .orderBy('sort_order')
      .orderBy('id')
      .execute();
    return rows.map(toRecord);
  }

  async findById(profileId: string, id: string): Promise<FoodLogRecord | null> {
    const row = await this.active(profileId).where('id', '=', id).executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async nextSortOrder(meal: MealRef): Promise<number> {
    const rows = await this.meal(meal).execute();
    return Math.max(0, ...rows.map((r) => r.sort_order)) + 1;
  }

  async insert(log: FoodLogRecord): Promise<void> {
    await this.db
      .insertInto('food_logs')
      .values({
        id: log.id,
        profile_id: log.profileId,
        log_date: log.logDate,
        meal_type: log.mealType,
        meal_name: log.mealName,
        food_id: log.foodId,
        food_snapshot: JSON.stringify(log.snapshot),
        sort_order: log.sortOrder,
        created_at: log.createdAt,
        ...nutrientColumns(log),
      })
      .execute();
  }

  async update(log: FoodLogRecord): Promise<void> {
    await this.db
      .updateTable('food_logs')
      .set(nutrientColumns(log))
      .where('id', '=', log.id)
      .where('profile_id', '=', log.profileId)
      .where('deleted_at', 'is', null)
      .execute();
  }

  async setMealConsumed(meal: MealRef, consumedAt: string | null, now: string): Promise<void> {
    const ids = (await this.meal(meal).execute()).map((r) => r.id);
    if (!ids.length) return;
    await this.db
      .updateTable('food_logs')
      .set({ consumed_at: consumedAt, updated_at: now })
      .where('profile_id', '=', meal.profileId)
      .where('id', 'in', ids)
      .execute();
  }

  async softDelete(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('food_logs')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }

  async isFoodUsed(foodId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('food_logs')
      .select('id')
      .where('food_id', '=', foodId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return row !== undefined;
  }
}
