import type {
  ApplyMealTemplateInput,
  CopyMealInput,
  MealTemplateDto,
  NutritionDay,
  SaveMealTemplateInput,
} from '@evully/contracts';
import {
  normalizeFoodLogDraft,
  normalizeMealTemplateName,
  NotFoundError,
  nutrientsFor,
  parseLocalDate,
  ValidationError,
  type FoodSnapshot,
  type MealType,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { FoodLogRecord } from '../ports/food-log-repository';
import type { MealTemplateRepository } from '../ports/meal-template-repository';
import { nutritionDay, snapshotOf, type FoodLogDeps } from './food-logs';

export interface MealShortcutDeps extends FoodLogDeps {
  templates: MealTemplateRepository;
}

interface MealAt {
  date: string;
  mealType: MealType;
  mealName: string | null;
}

const sameMeal = (log: FoodLogRecord, meal: MealAt) =>
  log.mealType === meal.mealType &&
  (meal.mealType !== 'custom' || log.mealName === meal.mealName?.trim());

async function mealLogs(deps: MealShortcutDeps, profileId: string, meal: MealAt) {
  const logs = await deps.logs.listDay(profileId, parseLocalDate(meal.date));
  const items = logs.filter((l) => sameMeal(l, meal));
  if (!items.length) throw new ValidationError('food_log.meal_empty', 'The meal has no foods');
  return items;
}

/** Adds planned logs to a meal, validating the target like a new log. */
async function addToMeal(
  deps: MealShortcutDeps,
  profileId: string,
  target: MealAt,
  items: {
    foodId: string;
    snapshot: FoodSnapshot;
    quantity: number;
    nutrients?: FoodLogRecord['nutrients'];
  }[],
): Promise<NutritionDay> {
  const { logs, clock, ids } = deps;
  await new GetProfile(deps.profiles).execute({ id: profileId });
  const today = clock.today();
  const drafts = items.map((item) =>
    normalizeFoodLogDraft({ logDate: target.date, ...target, quantity: item.quantity }, today),
  );
  const first = drafts[0];
  if (!first) throw new ValidationError('food_log.meal_empty', 'The meal has no foods');
  let sortOrder = await logs.nextSortOrder({ profileId, ...first });
  const now = clock.nowIso();
  for (const [index, item] of items.entries()) {
    const draft = drafts[index] ?? first;
    await logs.insert({
      id: ids.next(),
      profileId,
      logDate: draft.logDate,
      mealType: draft.mealType,
      mealName: draft.mealName,
      foodId: item.foodId,
      snapshot: item.snapshot,
      quantity: draft.quantity,
      nutrients: item.nutrients ?? nutrientsFor(item.snapshot, draft.quantity),
      // Copies and favorites are planned; the user confirms what was eaten.
      consumedAt: null,
      sortOrder: sortOrder++,
      createdAt: now,
      updatedAt: now,
    });
  }
  return nutritionDay(deps, profileId, first.logDate);
}

/**
 * Copies a meal to another meal or day ("duplicar" and "repetir de ontem",
 * README §9.5). The copy keeps the values of the source logs.
 */
export class CopyMeal {
  constructor(private readonly deps: MealShortcutDeps) {}

  async execute({ profileId, from, to }: CopyMealInput): Promise<NutritionDay> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const source = await mealLogs(this.deps, profileId, from);
    return addToMeal(this.deps, profileId, to, source);
  }
}

export class ListMealTemplates {
  constructor(private readonly deps: MealShortcutDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<MealTemplateDto[]> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const foods = new Map((await this.deps.foods.list()).map((f) => [f.id, f]));
    return (await this.deps.templates.list(profileId)).map((t) => {
      const items = t.items.flatMap(({ foodId, quantity }) => {
        const food = foods.get(foodId);
        if (!food) return [];
        return [
          {
            foodId,
            foodName: food.name,
            brand: food.brand,
            quantity,
            unit: food.referenceUnit,
            caloriesKcal: nutrientsFor(food, quantity).caloriesKcal,
          },
        ];
      });
      const kcal = items.reduce((total, i) => total + i.caloriesKcal, 0);
      return { id: t.id, name: t.name, items, caloriesKcal: Math.round(kcal * 10) / 10 };
    });
  }
}

/** Saves the foods and quantities of a meal as a favorite. */
export class SaveMealTemplate {
  constructor(private readonly deps: MealShortcutDeps) {}

  async execute({ profileId, name, ...meal }: SaveMealTemplateInput): Promise<MealTemplateDto> {
    const { templates, clock, ids } = this.deps;
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const items = await mealLogs(this.deps, profileId, meal);
    const existing = await templates.list(profileId);
    const id = ids.next();
    await templates.insert(
      {
        id,
        profileId,
        name: normalizeMealTemplateName(
          name,
          existing.map((t) => t.name),
        ),
        items: items.map((l) => ({ foodId: l.foodId, quantity: l.quantity })),
        createdAt: clock.nowIso(),
      },
      () => ids.next(),
    );
    const saved = (await new ListMealTemplates(this.deps).execute({ profileId })).find(
      (t) => t.id === id,
    );
    if (!saved) throw new NotFoundError('meal_template.not_found', 'Favorite meal not found');
    return saved;
  }
}

/** Applies a favorite with the current values of its foods. */
export class ApplyMealTemplate {
  constructor(private readonly deps: MealShortcutDeps) {}

  async execute({ profileId, templateId, ...target }: ApplyMealTemplateInput) {
    const { templates, foods } = this.deps;
    const template = await templates.findById(profileId, templateId);
    if (!template) throw new NotFoundError('meal_template.not_found', 'Favorite meal not found');
    const items = [];
    for (const item of template.items) {
      const food = await foods.findById(item.foodId);
      if (food)
        items.push({ foodId: food.id, snapshot: snapshotOf(food), quantity: item.quantity });
    }
    return addToMeal(this.deps, profileId, target, items);
  }
}

export class RemoveMealTemplate {
  constructor(private readonly deps: MealShortcutDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    const removed = await this.deps.templates.softDelete(profileId, id, this.deps.clock.nowIso());
    if (!removed) throw new NotFoundError('meal_template.not_found', 'Favorite meal not found');
    return null;
  }
}
