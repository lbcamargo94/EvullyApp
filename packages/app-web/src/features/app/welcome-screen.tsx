import { useAppInfo } from '@evully/app-core';
import { Button } from '@evully/ui';
import { messages } from './messages.pt-BR';

export function WelcomeScreen() {
  const { data, isError } = useAppInfo();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 font-sans text-text">
      <h1 className="text-3xl font-bold tracking-tight text-brand">Evully</h1>
      <p className="text-text-muted">{messages.subtitle}</p>
      <Button type="button">{messages.start}</Button>
      <p className="text-sm text-text-muted">
        {isError ? messages.versionError : data ? messages.version(data.version) : messages.loading}
      </p>
    </main>
  );
}
