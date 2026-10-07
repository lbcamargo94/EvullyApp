import { useAcceptHealthNotice } from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { Logo } from './logo';
import { shellMessages as m } from './messages.pt-BR';

/** Shown once per installation, before anything else (README §8.1). */
export function HealthNoticeScreen() {
  const accept = useAcceptHealthNotice();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-text">
      <Card className="w-full max-w-lg gap-6 p-8" aria-labelledby="health-title">
        <Logo />
        <h1 id="health-title" className="text-2xl font-semibold">
          {m.healthTitle}
        </h1>
        <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
          {m.healthBody.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <Button
          type="button"
          className="self-end"
          disabled={accept.isPending}
          onClick={() => accept.mutate(undefined)}
        >
          {m.healthAccept}
        </Button>
      </Card>
    </main>
  );
}
