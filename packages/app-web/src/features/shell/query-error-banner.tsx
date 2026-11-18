import { useQueryErrors } from '@evully/app-core';
import { Alert, Button } from '@evully/ui';
import { shellMessages as m } from './messages.pt-BR';

/** Shown when data failed to load, with a retry (DESIGN.md §6). */
export function QueryErrorBanner() {
  const { failed, retry } = useQueryErrors();
  if (!failed) return null;

  return (
    <Alert
      tone="danger"
      title={m.loadErrorTitle}
      actions={
        <Button type="button" variant="secondary" onClick={retry}>
          {m.retry}
        </Button>
      }
    >
      {m.loadErrorBody}
    </Alert>
  );
}
