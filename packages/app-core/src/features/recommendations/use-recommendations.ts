import type { RecommendationList, RecommendationSettings } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const keys = {
  list: (profileId: string) => ['recommendations', profileId, 'list'] as const,
  settings: (profileId: string) => ['recommendations', profileId, 'settings'] as const,
};

/**
 * The profile's signals (README §20.2). Listing evaluates the rules, so it
 * refreshes whenever the screen comes back into view.
 */
export function useRecommendations(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.list(profileId ?? ''),
    queryFn: () => client.recommendations.list(profileId ?? ''),
    enabled: profileId !== null,
    refetchOnMount: 'always',
  });
}

/** Dismiss or snooze a signal; the answer replaces the cached list. */
export function useDecideRecommendation(profileId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'dismissed' | 'snoozed' }) =>
      client.recommendations.decide({ profileId, id, decision }),
    onSuccess: (list: RecommendationList) => queryClient.setQueryData(keys.list(profileId), list),
  });
}

/** Accepts a tracking suggestion; the tracked measurements change with it. */
export function useAcceptRecommendation(profileId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.recommendations.accept(profileId, id),
    onSuccess: async (list: RecommendationList) => {
      queryClient.setQueryData(keys.list(profileId), list);
      await queryClient.invalidateQueries({ queryKey: ['tracking', profileId] });
    },
  });
}

export function useRecommendationSettings(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.settings(profileId ?? ''),
    queryFn: () => client.recommendations.settings(profileId ?? ''),
    enabled: profileId !== null,
  });
}

/** Turning a rule off or on re-evaluates the signals on the next list. */
export function useSetRecommendationSettings(profileId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: RecommendationSettings) =>
      client.recommendations.setSettings(profileId, settings),
    onSuccess: async (settings: RecommendationSettings) => {
      queryClient.setQueryData(keys.settings(profileId), settings);
      await queryClient.invalidateQueries({ queryKey: keys.list(profileId) });
    },
  });
}
