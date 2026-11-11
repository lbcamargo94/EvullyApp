import { useQueryClient, type Query, type QueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';

/** Queries whose screen shows its own error message set `meta: { localError: true }`. */
const unhandled = (query: Query) =>
  query.state.status === 'error' && query.meta?.['localError'] !== true;

/** Whether some loaded data failed and no screen explains it. */
export function hasUnhandledQueryError(queryClient: QueryClient): boolean {
  return queryClient.getQueryCache().getAll().some(unhandled);
}

/** Loads the failed data again. */
export function retryFailedQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.refetchQueries({ predicate: unhandled });
}

/**
 * Failed data loads for the shell banner (DESIGN.md §6): one place covers
 * every screen instead of a message per query.
 */
export function useQueryErrors(): { failed: boolean; retry: () => void } {
  const queryClient = useQueryClient();
  const failed = useSyncExternalStore(
    (onChange) => queryClient.getQueryCache().subscribe(onChange),
    () => hasUnhandledQueryError(queryClient),
  );
  const retry = useCallback(() => void retryFailedQueries(queryClient), [queryClient]);
  return { failed, retry };
}
