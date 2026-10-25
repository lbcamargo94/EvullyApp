export interface MealTemplateItemRecord {
  foodId: string;
  quantity: number;
}

export interface MealTemplateRecord {
  id: string;
  profileId: string;
  name: string;
  items: MealTemplateItemRecord[];
  createdAt: string;
}

/** Every query is scoped by profile (README §6.1). */
export interface MealTemplateRepository {
  /** Active templates ordered by name, items in their order. */
  list(profileId: string): Promise<MealTemplateRecord[]>;
  findById(profileId: string, id: string): Promise<MealTemplateRecord | null>;
  insert(template: MealTemplateRecord, newId: () => string): Promise<void>;
  softDelete(profileId: string, id: string, now: string): Promise<boolean>;
  /** True when an active template of any profile uses the food. */
  isFoodUsed(foodId: string): Promise<boolean>;
}
