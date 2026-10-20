import type { ProjectDraft, WeightDisplay } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

/** Refreshes everything a settings change can affect on screen. */
function useRefreshProfile(profileId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['tracking', 'projects', 'weights', 'measurements', 'tags'].map((root) =>
        queryClient.invalidateQueries({ queryKey: [root, profileId] }),
      ),
    );
}

export function useMeasurementCatalog() {
  const client = useEvullyClient();
  return useQuery({ queryKey: ['catalog'], queryFn: () => client.tracking.catalog() });
}

export function useSetWeightDisplay(profileId: string) {
  const client = useEvullyClient();
  const refresh = useRefreshProfile(profileId);
  return useMutation({
    mutationFn: (weightDisplay: WeightDisplay) =>
      client.tracking.setWeightDisplay(profileId, weightDisplay),
    onSuccess: refresh,
  });
}

export function useSetTrackedMeasurements(profileId: string) {
  const client = useEvullyClient();
  const refresh = useRefreshProfile(profileId);
  return useMutation({
    mutationFn: (ids: string[]) => client.tracking.setMeasurements(profileId, ids),
    onSuccess: refresh,
  });
}

export function useProjects(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: ['projects', profileId ?? '', 'list'],
    queryFn: () => client.projects.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useCreateProject(profileId: string) {
  const client = useEvullyClient();
  const refresh = useRefreshProfile(profileId);
  return useMutation({
    mutationFn: (draft: ProjectDraft) => client.projects.create({ profileId, ...draft }),
    onSuccess: refresh,
  });
}

export function useUpdateProject(profileId: string) {
  const client = useEvullyClient();
  const refresh = useRefreshProfile(profileId);
  return useMutation({
    mutationFn: ({ id, ...draft }: ProjectDraft & { id: string }) =>
      client.projects.update({ profileId, id, ...draft }),
    onSuccess: refresh,
  });
}

export function useCompleteProject(profileId: string) {
  const client = useEvullyClient();
  const refresh = useRefreshProfile(profileId);
  return useMutation({
    mutationFn: (id: string) => client.projects.complete(profileId, id),
    onSuccess: refresh,
  });
}

export function useRenameTag(profileId: string) {
  const client = useEvullyClient();
  const refresh = useRefreshProfile(profileId);
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      client.tags.rename({ profileId, id, name }),
    onSuccess: refresh,
  });
}

export function useRemoveTag(profileId: string) {
  const client = useEvullyClient();
  const refresh = useRefreshProfile(profileId);
  return useMutation({
    mutationFn: (id: string) => client.tags.remove(profileId, id),
    onSuccess: refresh,
  });
}
