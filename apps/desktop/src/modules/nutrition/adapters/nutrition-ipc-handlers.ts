import type { FoodDto } from '@evully/contracts';
import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  AddFoodLog,
  GetNutritionDay,
  RemoveFoodLog,
  SetFoodLogConsumed,
  SetMealConsumed,
  UpdateFoodLogQuantity,
  type FoodLogDeps,
} from '../application/food-logs';
import { CreateFood, ListFoods, RemoveFood, UpdateFood } from '../application/manage-foods';
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
  | 'nutrition:remove';

const toDto = (food: FoodRecord): FoodDto => food;

export function nutritionIpcHandlers(deps: FoodLogDeps): Pick<IpcHandlers, NutritionChannels> {
  const { foods, logs, clock, ids } = deps;
  const list = new ListFoods(foods);
  const create = new CreateFood(foods, clock, ids);
  const update = new UpdateFood(foods, clock);
  const remove = new RemoveFood(foods, logs, clock);
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
  };
}
