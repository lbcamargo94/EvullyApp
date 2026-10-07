import { EvullyClientProvider, type EvullyClient } from '@evully/app-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WelcomeScreen } from './features/app/welcome-screen';

export function App({ client }: { client: EvullyClient }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <EvullyClientProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen />
      </QueryClientProvider>
    </EvullyClientProvider>
  );
}
