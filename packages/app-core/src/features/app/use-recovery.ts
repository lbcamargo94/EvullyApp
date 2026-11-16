import { useMutation, useQuery } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

/**
 * Recovery mode (README §14.2.1): the desktop started with a damaged
 * database. Elsewhere it is never damaged. `damaged` is undefined while loading.
 */
export function useRecoveryStatus(): { damaged: boolean | undefined } {
  const client = useEvullyClient();
  const recovery = client.recovery;
  const { data } = useQuery({
    queryKey: ['recovery'],
    queryFn: () => (recovery ? recovery.status() : Promise.resolve({ damaged: false })),
    staleTime: Infinity,
    meta: { localError: true },
  });
  return { damaged: data?.damaged };
}

/** "Abrir pasta de logs" exists only where the client supports it (desktop). */
export function useOpenLogs() {
  const client = useEvullyClient();
  const openLogs = client.app.openLogs;
  const mutation = useMutation({
    mutationFn: () => (openLogs ? openLogs() : Promise.resolve(null)),
  });
  return { ...mutation, available: openLogs !== undefined };
}
