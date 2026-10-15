import type { UpdateWeightInput, WeightInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const keys = {
  all: (profileId: string) => ['weights', profileId] as const,
  list: (profileId: string) => ['weights', profileId, 'list'] as const,
  summary: (profileId: string) => ['weights', profileId, 'summary'] as const,
  tags: (profileId: string) => ['tags', profileId] as const,
};

export function useWeights(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.list(profileId ?? ''),
    queryFn: () => client.weights.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useWeightSummary(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.summary(profileId ?? ''),
    queryFn: () => client.weights.summary(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useTags(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.tags(profileId ?? ''),
    queryFn: () => client.tags.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

function useWeightMutation<TInput>(profileId: string, run: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all(profileId) }),
  });
}

export function useRegisterWeight(profileId: string) {
  const client = useEvullyClient();
  return useWeightMutation(profileId, (input: WeightInput) => client.weights.register(input));
}

export function useUpdateWeight(profileId: string) {
  const client = useEvullyClient();
  return useWeightMutation(profileId, (input: UpdateWeightInput) => client.weights.update(input));
}

export function useDeleteWeight(profileId: string) {
  const client = useEvullyClient();
  return useWeightMutation(profileId, (id: string) => client.weights.remove(profileId, id));
}

export function useCreateTag(profileId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => client.tags.create({ profileId, name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.tags(profileId) }),
  });
}
