import type { UpdateStatus } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = ['updates'] as const;
const busy = (s: UpdateStatus | undefined) => s?.state === 'checking' || s?.state === 'downloading';

/**
 * Polled only while something can change: fast while checking or downloading,
 * slower until the start-up check begins; stops once a result is known.
 */
export function useUpdateStatus() {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key,
    queryFn: () => client.updates.status(),
    refetchInterval: (query) => {
      const status = query.state.data;
      if (busy(status)) return 1000;
      return status?.state === 'idle' ? 5000 : false;
    },
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
