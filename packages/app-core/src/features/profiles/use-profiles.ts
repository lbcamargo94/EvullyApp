import type { DeleteProfileInput, ProfileInput, UpdateProfileInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const keys = {
  all: ['profiles'] as const,
  detail: (id: string) => ['profiles', id] as const,
  archived: ['profiles', 'archived'] as const,
};

export function useProfiles() {
  const client = useEvullyClient();
  return useQuery({ queryKey: keys.all, queryFn: () => client.profiles.list() });
}

export function useProfile(id: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.detail(id ?? ''),
    queryFn: () => client.profiles.get(id ?? ''),
    enabled: id !== null,
  });
}

export function useCreateProfile() {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => client.profiles.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateProfile() {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => client.profiles.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useArchivedProfiles() {
  const client = useEvullyClient();
  return useQuery({ queryKey: keys.archived, queryFn: () => client.profiles.listArchived() });
}

/** Archive, restore and delete change both lists (active and archived). */
function useProfileListMutation<TInput>(run: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useArchiveProfile() {
  const client = useEvullyClient();
  return useProfileListMutation((id: string) => client.profiles.archive(id));
}

export function useRestoreProfile() {
  const client = useEvullyClient();
  return useProfileListMutation((id: string) => client.profiles.restore(id));
}

export function useDeleteProfilePermanently() {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteProfileInput) => client.profiles.deletePermanently(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.all }),
        // A backup was written first: refresh "Último backup".
        queryClient.invalidateQueries({ queryKey: ['backup'] }),
      ]),
  });
}
