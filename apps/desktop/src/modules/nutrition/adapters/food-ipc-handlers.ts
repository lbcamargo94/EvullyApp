import type { FoodDto } from '@evully/contracts';
import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { Clock, IdGenerator } from '../../shared/ports';
import { CreateFood, ListFoods, RemoveFood, UpdateFood } from '../application/manage-foods';
import type { FoodRecord, FoodRepository } from '../ports/food-repository';

type FoodChannels = 'foods:list' | 'foods:create' | 'foods:update' | 'foods:remove';

const toDto = (food: FoodRecord): FoodDto => food;

export function foodIpcHandlers(
  foods: FoodRepository,
  clock: Clock,
  ids: IdGenerator,
): Pick<IpcHandlers, FoodChannels> {
  const list = new ListFoods(foods);
  const create = new CreateFood(foods, clock, ids);
  const update = new UpdateFood(foods, clock);
  const remove = new RemoveFood(foods, clock);
  return {
    'foods:list': async () => (await list.execute()).map(toDto),
    'foods:create': async (input) => toDto(await create.execute(input)),
    'foods:update': async (input) => toDto(await update.execute(input)),
    'foods:remove': (input) => remove.execute(input),
  };
}
