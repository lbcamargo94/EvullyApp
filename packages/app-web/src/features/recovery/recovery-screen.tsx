import { useOpenLogs } from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { CircleAlert } from 'lucide-react';
import { RestorePanel } from '../settings/restore-panel';
import { Logo } from '../shell/logo';
import { recoveryMessages as m } from './messages.pt-BR';

/**
 * Shown instead of the app when the database fails the integrity check
 * (README §14.2.1): restore a backup; nothing is deleted.
 */
export function RecoveryScreen() {
  const logs = useOpenLogs();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-text">
      <Card className="w-full max-w-2xl gap-6 p-8" aria-labelledby="recovery-title">
        <Logo />
        <div className="flex items-start gap-3">
          <CircleAlert aria-hidden="true" className="mt-1 size-6 shrink-0 text-danger" />
          <h1 id="recovery-title" className="text-2xl font-semibold">
            {m.title}
          </h1>
        </div>
        <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
          {m.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <section aria-labelledby="recovery-backups" className="flex flex-col gap-3">
          <h2 id="recovery-backups" className="text-lg font-semibold">
            {m.backups}
          </h2>
          <RestorePanel recovery />
          <p className="text-sm text-text-muted">{m.noExtraFolder}</p>
        </section>
        {logs.available && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => logs.mutate()}>
              {m.openLogs}
            </Button>
            <span className="text-sm text-text-muted">{m.logsHint}</span>
          </div>
        )}
      </Card>
    </main>
  );
}
