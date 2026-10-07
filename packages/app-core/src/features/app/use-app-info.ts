import { useQuery } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

export function useAppInfo() {
  const client = useEvullyClient();
  return useQuery({ queryKey: ['app', 'info'], queryFn: () => client.app.info() });
}
