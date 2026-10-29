import type { FoodNutrients, FoodSnapshot, LocalDate, MealType } from '@evully/domain';

export interface FoodLogRecord {
  id: string;
  profileId: string;
  logDate: LocalDate;
  mealType: MealType;
  mealName: string | null;
  foodId: string;
  snapshot: FoodSnapshot;
  quantity: number;
  nutrients: FoodNutrients;
  consumedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealRef {
  profileId: string;
  logDate: LocalDate;
  mealType: MealType;
  mealName: string | null;
}

export interface DailyConsumed {
  date: LocalDate;
  caloriesKcal: number;
  proteinG: number;
}

/** Every query is scoped by profile (README §6.1). */
export interface FoodLogRepository {
  /** Active logs of a day, by meal order then insertion order. */
  listDay(profileId: string, date: LocalDate): Promise<FoodLogRecord[]>;
  /** Sums of the consumed active logs per day, oldest first. */
  dailyConsumed(profileId: string): Promise<DailyConsumed[]>;
  findById(profileId: string, id: string): Promise<FoodLogRecord | null>;
  /** Next position inside a meal (1 for an empty meal). */
  nextSortOrder(meal: MealRef): Promise<number>;
  insert(log: FoodLogRecord): Promise<void>;
  /** Saves quantity, nutrients and consumption. */
  update(log: FoodLogRecord): Promise<void>;
  setMealConsumed(meal: MealRef, consumedAt: string | null, now: string): Promise<void>;
  softDelete(profileId: string, id: string, now: string): Promise<boolean>;
  /** True when any active log of any profile uses the food. */
  isFoodUsed(foodId: string): Promise<boolean>;
}
