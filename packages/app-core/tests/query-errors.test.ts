import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { hasUnhandledQueryError, retryFailedQueries } from '../src/features/app/use-query-errors';

const failing = () => Promise.reject(new Error('ipc failed'));

describe('query errors (DESIGN.md §6)', () => {
  it('reports a failed load until a retry succeeds', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let fail = true;
    const queryFn = () => (fail ? failing() : Promise.resolve(1));
    await client.prefetchQuery({ queryKey: ['weights'], queryFn });
    expect(hasUnhandledQueryError(client)).toBe(true);

    fail = false;
    await retryFailedQueries(client);
    expect(hasUnhandledQueryError(client)).toBe(false);
  });

  it('ignores queries whose screen shows its own error', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await client.prefetchQuery({
      queryKey: ['legal'],
      queryFn: failing,
      meta: { localError: true },
    });
    expect(hasUnhandledQueryError(client)).toBe(false);
  });
});
