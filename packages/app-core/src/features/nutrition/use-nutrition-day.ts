import type {
  ApplyMealTemplateInput,
  CopyMealInput,
  FoodLogInput,
  NutritionDay,
  SaveMealTemplateInput,
  SetMealConsumedInput,
} from '@evully/contracts';
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

export function useCopyMeal(profileId: string) {
  const client = useEvullyClient();
  return useDayMutation(profileId, (input: Omit<CopyMealInput, 'profileId'>) =>
    client.nutrition.copyMeal({ profileId, ...input }),
  );
}

const templatesKey = (profileId: string) => ['meal-templates', profileId] as const;

export function useMealTemplates(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: templatesKey(profileId ?? ''),
    queryFn: () => client.mealTemplates.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useApplyMealTemplate(profileId: string) {
  const client = useEvullyClient();
  return useDayMutation(profileId, (input: Omit<ApplyMealTemplateInput, 'profileId'>) =>
    client.mealTemplates.apply({ profileId, ...input }),
  );
}

/** Favorites change which foods can be removed from the catalog. */
function useTemplateMutation<TInput, TOutput>(
  profileId: string,
  run: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: templatesKey(profileId) }),
        queryClient.invalidateQueries({ queryKey: ['foods'] }),
      ]),
  });
}

export function useSaveMealTemplate(profileId: string) {
  const client = useEvullyClient();
  return useTemplateMutation(profileId, (input: Omit<SaveMealTemplateInput, 'profileId'>) =>
    client.mealTemplates.save({ profileId, ...input }),
  );
}

export function useRemoveMealTemplate(profileId: string) {
  const client = useEvullyClient();
  return useTemplateMutation(profileId, (id: string) => client.mealTemplates.remove(profileId, id));
}
