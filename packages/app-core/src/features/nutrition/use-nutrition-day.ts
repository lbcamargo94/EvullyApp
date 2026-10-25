import type { FoodLogInput, NutritionDay, SetMealConsumedInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const dayKey = (profileId: string, date: string) => ['nutrition', profileId, date] as const;

export function useNutritionDay(profileId: string | null, date: string) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: dayKey(profileId ?? '', date),
    queryFn: () => client.nutrition.day(profileId ?? '', date),
    enabled: profileId !== null,
  });
}

/** Every food log change returns the whole day, which replaces the cached one. */
function useDayMutation<TInput>(profileId: string, run: (input: TInput) => Promise<NutritionDay>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async (day) => {
      queryClient.setQueryData(dayKey(profileId, day.date), day);
      // A logged food can no longer be removed from the catalog.
      await queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
  });
}

export function useAddFoodLog(profileId: string) {
  const client = useEvullyClient();
  return useDayMutation(profileId, (input: Omit<FoodLogInput, 'profileId'>) =>
    client.nutrition.add({ profileId, ...input }),
  );
}

export function useUpdateFoodLogQuantity(profileId: string) {
  const client = useEvullyClient();
  return useDayMutation(profileId, ({ id, quantity }: { id: string; quantity: number }) =>
    client.nutrition.updateQuantity(profileId, id, quantity),
  );
}

export function useSetFoodLogConsumed(profileId: string) {
  const client = useEvullyClient();
  return useDayMutation(profileId, ({ id, consumed }: { id: string; consumed: boolean }) =>
    client.nutrition.setConsumed(profileId, id, consumed),
  );
}

export function useSetMealConsumed(profileId: string) {
  const client = useEvullyClient();
  return useDayMutation(profileId, (input: Omit<SetMealConsumedInput, 'profileId'>) =>
    client.nutrition.setMealConsumed({ profileId, ...input }),
  );
}

export function useRemoveFoodLog(profileId: string) {
  const client = useEvullyClient();
  return useDayMutation(profileId, (id: string) => client.nutrition.remove(profileId, id));
}
