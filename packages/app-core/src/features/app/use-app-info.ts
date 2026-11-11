import { useQuery } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

export function useAppInfo() {
  const client = useEvullyClient();
  return useQuery({ queryKey: ['app', 'info'], queryFn: () => client.app.info() });
}

export function useLegalDocuments(enabled = true) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: ['app', 'legal'],
    queryFn: () => client.app.legal(),
    enabled,
    staleTime: Infinity,
    meta: { localError: true },
  });
}
