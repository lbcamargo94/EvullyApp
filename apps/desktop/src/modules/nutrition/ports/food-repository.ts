import type { FoodDraft } from '@evully/domain';

export interface FoodRecord extends FoodDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Household catalog: not scoped by profile (README §6.1). */
export interface FoodRepository {
  /** Active foods ordered by name. */
  list(): Promise<FoodRecord[]>;
  findById(id: string): Promise<FoodRecord | null>;
  insert(food: FoodRecord): Promise<void>;
  update(food: FoodRecord): Promise<void>;
  /** Soft delete; false when there is no active food with this id. */
  softDelete(id: string, now: string): Promise<boolean>;
}
