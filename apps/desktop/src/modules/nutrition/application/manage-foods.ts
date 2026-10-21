import type { FoodInput, UpdateFoodInput } from '@evully/contracts';
import { assertUniqueFood, normalizeFoodDraft, NotFoundError } from '@evully/domain';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { FoodRecord, FoodRepository } from '../ports/food-repository';

const notFound = () => new NotFoundError('food.not_found', 'Food not found');

export class ListFoods {
  constructor(private readonly foods: FoodRepository) {}

  execute(): Promise<FoodRecord[]> {
    return this.foods.list();
  }
}

export class CreateFood {
  constructor(
    private readonly foods: FoodRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: FoodInput): Promise<FoodRecord> {
    const draft = normalizeFoodDraft(input);
    assertUniqueFood(draft, await this.foods.list());
    const now = this.clock.nowIso();
    const food: FoodRecord = { ...draft, id: this.ids.next(), createdAt: now, updatedAt: now };
    await this.foods.insert(food);
    return food;
  }
}

/** Editing a food never changes what was already logged (records copy nutrients, README §9.4). */
export class UpdateFood {
  constructor(
    private readonly foods: FoodRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id, ...input }: UpdateFoodInput): Promise<FoodRecord> {
    const current = await this.foods.findById(id);
    if (!current) throw notFound();
    const draft = normalizeFoodDraft(input);
    assertUniqueFood(
      draft,
      (await this.foods.list()).filter((f) => f.id !== id),
    );
    const food: FoodRecord = { ...current, ...draft, updatedAt: this.clock.nowIso() };
    await this.foods.update(food);
    return food;
  }
}

/**
 * Soft delete. Food logs arrive in V0.2 alpha.2; from then on a food that was
 * already logged cannot be removed (README §9.5).
 */
export class RemoveFood {
  constructor(
    private readonly foods: FoodRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id }: { id: string }): Promise<null> {
    if (!(await this.foods.softDelete(id, this.clock.nowIso()))) throw notFound();
    return null;
  }
}
