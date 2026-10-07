import { createContext, useContext, type ReactNode } from 'react';
import type { EvullyClient } from './client';

const ClientContext = createContext<EvullyClient | null>(null);

export function EvullyClientProvider({
  client,
  children,
}: {
  client: EvullyClient;
  children: ReactNode;
}) {
  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
}

export function useEvullyClient(): EvullyClient {
  const client = useContext(ClientContext);
  if (!client) throw new Error('useEvullyClient must be used inside EvullyClientProvider');
  return client;
}
