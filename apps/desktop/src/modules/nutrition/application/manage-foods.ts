import type { FoodInput, UpdateFoodInput } from '@evully/contracts';
import { assertUniqueFood, ConflictError, normalizeFoodDraft, NotFoundError } from '@evully/domain';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { FoodLogRepository } from '../ports/food-log-repository';
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

/** Soft delete, only for foods never logged by any profile (README §9.5). */
export class RemoveFood {
  constructor(
    private readonly foods: FoodRepository,
    private readonly logs: FoodLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id }: { id: string }): Promise<null> {
    if (await this.logs.isFoodUsed(id)) {
      throw new ConflictError('food.in_use', 'Food is used in food logs');
    }
    if (!(await this.foods.softDelete(id, this.clock.nowIso()))) throw notFound();
    return null;
  }
}
