import type { ProfileInput, UpdateProfileInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const keys = {
  all: ['profiles'] as const,
  detail: (id: string) => ['profiles', id] as const,
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
