import type { FoodInput, UpdateFoodInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

/** Household catalog: one cache for every profile (README §6.1). */
const key = ['foods'] as const;

export function useFoods() {
  const client = useEvullyClient();
  return useQuery({ queryKey: key, queryFn: () => client.foods.list() });
}

function useFoodMutation<TInput, TOutput>(run: (input: TInput) => Promise<TOutput>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useCreateFood() {
  const client = useEvullyClient();
  return useFoodMutation((input: FoodInput) => client.foods.create(input));
}

export function useUpdateFood() {
  const client = useEvullyClient();
  return useFoodMutation((input: UpdateFoodInput) => client.foods.update(input));
}

export function useRemoveFood() {
  const client = useEvullyClient();
  return useFoodMutation((id: string) => client.foods.remove(id));
}

/** Search key: lower case, no accents ("feijao" finds "Feijão"). */
export function foodSearchKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}
