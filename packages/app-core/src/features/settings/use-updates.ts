import type { UpdateStatus } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = ['updates'] as const;
const busy = (s: UpdateStatus | undefined) => s?.state === 'checking' || s?.state === 'downloading';

/** Polled: fast while checking or downloading, otherwise every minute. */
export function useUpdateStatus() {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key,
    queryFn: () => client.updates.status(),
    refetchInterval: (query) => (busy(query.state.data) ? 1000 : 60_000),
  });
}

export function useCheckForUpdates() {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.updates.check(),
    onSuccess: (status) => queryClient.setQueryData(key, status),
  });
}

export function useInstallUpdate() {
  const client = useEvullyClient();
  return useMutation({ mutationFn: () => client.updates.install() });
}
