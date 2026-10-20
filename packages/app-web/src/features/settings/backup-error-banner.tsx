import { useBackupStatus, useDismissBackupError } from '@evully/app-core';
import { Button } from '@evully/ui';
import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { settingsMessages as m } from './messages.pt-BR';

/** Shown on every screen after an automatic backup failure, until dismissed (README §8.7.2). */
export function BackupErrorBanner() {
  const { data: status } = useBackupStatus();
  const dismiss = useDismissBackupError();
  if (!status?.lastError) return null;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-md border border-caution/40 bg-caution-soft px-4 py-3 text-text"
    >
      <TriangleAlert aria-hidden="true" className="size-5 text-caution" />
      <div className="flex min-w-0 flex-1 flex-col">
        <strong className="font-semibold">{m.errorTitle}</strong>
        <span className="text-sm">{m.errorBody(status.lastError.at)}</span>
      </div>
      <Button asChild variant="secondary">
        <Link to="/app/settings?tab=general">{m.errorAction}</Link>
      </Button>
      <Button type="button" variant="ghost" onClick={() => dismiss.mutate(undefined)}>
        {m.dismiss}
      </Button>
    </div>
  );
}
