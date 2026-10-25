import type { FoodDto } from '@evully/contracts';
import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  AddFoodLog,
  GetNutritionDay,
  RemoveFoodLog,
  SetFoodLogConsumed,
  SetMealConsumed,
  UpdateFoodLogQuantity,
} from '../application/food-logs';
import { CreateFood, ListFoods, RemoveFood, UpdateFood } from '../application/manage-foods';
import {
  ApplyMealTemplate,
  CopyMeal,
  ListMealTemplates,
  RemoveMealTemplate,
  SaveMealTemplate,
  type MealShortcutDeps,
} from '../application/meal-shortcuts';
import {
  AddWaterLog,
  GetNutritionTarget,
  RemoveWaterLog,
  SetNutritionTarget,
} from '../application/targets-water';
import {
  AnswerNutritionQuestionnaire,
  GetNutritionPreferences,
  SkipNutritionQuestionnaire,
} from '../application/nutrition-preferences';
import type { NutritionQuestionnaireRepository } from '../ports/nutrition-questionnaire-repository';
import type { FoodRecord } from '../ports/food-repository';

type NutritionChannels =
  | 'foods:list'
  | 'foods:create'
  | 'foods:update'
  | 'foods:remove'
  | 'nutrition:day'
  | 'nutrition:add'
  | 'nutrition:update-quantity'
  | 'nutrition:set-consumed'
  | 'nutrition:set-meal-consumed'
  | 'nutrition:remove'
  | 'nutrition:copy-meal'
  | 'meal-templates:list'
  | 'meal-templates:save'
  | 'meal-templates:apply'
  | 'meal-templates:remove'
  | 'nutrition-targets:current'
  | 'nutrition-targets:set'
  | 'water:add'
  | 'water:remove'
  | 'nutrition-preferences:get'
  | 'nutrition-preferences:answer'
  | 'nutrition-preferences:skip';

const toDto = (food: FoodRecord): FoodDto => food;

export function nutritionIpcHandlers(
  deps: MealShortcutDeps & { questionnaires: NutritionQuestionnaireRepository },
): Pick<IpcHandlers, NutritionChannels> {
  const { foods, logs, templates, clock, ids } = deps;
  const list = new ListFoods(foods);
  const create = new CreateFood(foods, clock, ids);
  const update = new UpdateFood(foods, clock);
  const remove = new RemoveFood(foods, logs, templates, clock);
  return {
    'foods:list': async () => (await list.execute()).map(toDto),
    'foods:create': async (input) => toDto(await create.execute(input)),
    'foods:update': async (input) => toDto(await update.execute(input)),
    'foods:remove': (input) => remove.execute(input),
    'nutrition:day': (input) => new GetNutritionDay(deps).execute(input),
    'nutrition:add': (input) => new AddFoodLog(deps).execute(input),
    'nutrition:update-quantity': (input) => new UpdateFoodLogQuantity(deps).execute(input),
    'nutrition:set-consumed': (input) => new SetFoodLogConsumed(deps).execute(input),
    'nutrition:set-meal-consumed': (input) => new SetMealConsumed(deps).execute(input),
    'nutrition:remove': (input) => new RemoveFoodLog(deps).execute(input),
    'nutrition:copy-meal': (input) => new CopyMeal(deps).execute(input),
    'meal-templates:list': (input) => new ListMealTemplates(deps).execute(input),
    'meal-templates:save': (input) => new SaveMealTemplate(deps).execute(input),
    'meal-templates:apply': (input) => new ApplyMealTemplate(deps).execute(input),
    'meal-templates:remove': (input) => new RemoveMealTemplate(deps).execute(input),
    'nutrition-targets:current': (input) => new GetNutritionTarget(deps).execute(input),
    'nutrition-targets:set': (input) => new SetNutritionTarget(deps).execute(input),
    'water:add': (input) => new AddWaterLog(deps).execute(input),
    'water:remove': (input) => new RemoveWaterLog(deps).execute(input),
    'nutrition-preferences:get': (input) => new GetNutritionPreferences(deps).execute(input),
    'nutrition-preferences:answer': (input) =>
      new AnswerNutritionQuestionnaire(deps).execute(input),
    'nutrition-preferences:skip': (input) => new SkipNutritionQuestionnaire(deps).execute(input),
  };
}
