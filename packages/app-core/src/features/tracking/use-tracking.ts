import type { TrackingAnswers } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const keys = {
  tracking: (profileId: string) => ['tracking', profileId] as const,
  activeProject: (profileId: string) => ['projects', profileId, 'active'] as const,
};

export function useTrackingState(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.tracking(profileId ?? ''),
    queryFn: () => client.tracking.getState(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useActiveProject(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.activeProject(profileId ?? ''),
    queryFn: () => client.projects.getActive(profileId ?? ''),
    enabled: profileId !== null,
  });
}

function useTrackingMutation<TInput>(profileId: string, run: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.tracking(profileId) }),
        queryClient.invalidateQueries({ queryKey: keys.activeProject(profileId) }),
      ]);
    },
  });
}

export function useAcceptTracking(profileId: string) {
  const client = useEvullyClient();
  return useTrackingMutation(profileId, (answers: TrackingAnswers) =>
    client.tracking.accept({ profileId, answers }),
  );
}

export function useSkipTracking(profileId: string) {
  const client = useEvullyClient();
  return useTrackingMutation(profileId, () => client.tracking.skip(profileId));
}
