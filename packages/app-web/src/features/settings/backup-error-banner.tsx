import { useBackupStatus, useDismissBackupError } from '@evully/app-core';
import { Alert, Button } from '@evully/ui';
import { Link } from 'react-router';
import { settingsMessages as m } from './messages.pt-BR';

/** Shown on every screen after an automatic backup failure, until dismissed (README §8.7.2). */
export function BackupErrorBanner() {
  const { data: status } = useBackupStatus();
  const dismiss = useDismissBackupError();
  if (!status?.lastError) return null;

  return (
    <Alert
      tone="caution"
      title={m.errorTitle}
      actions={
        <>
          <Button asChild variant="secondary">
            <Link to="/app/settings?tab=general">{m.errorAction}</Link>
          </Button>
          <Button type="button" variant="ghost" onClick={() => dismiss.mutate(undefined)}>
            {m.dismiss}
          </Button>
        </>
      }
    >
      {m.errorBody(status.lastError.at)}
    </Alert>
  );
}
