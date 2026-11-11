import { useQueryErrors } from '@evully/app-core';
import { Button } from '@evully/ui';
import { CircleAlert } from 'lucide-react';
import { shellMessages as m } from './messages.pt-BR';

/** Shown when data failed to load, with a retry (DESIGN.md §6). */
export function QueryErrorBanner() {
  const { failed, retry } = useQueryErrors();
  if (!failed) return null;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-md border border-danger bg-surface px-4 py-3 text-text"
    >
      <CircleAlert aria-hidden="true" className="size-5 text-danger" />
      <div className="flex min-w-0 flex-1 flex-col">
        <strong className="font-semibold">{m.loadErrorTitle}</strong>
        <span className="text-sm">{m.loadErrorBody}</span>
      </div>
      <Button type="button" variant="secondary" onClick={retry}>
        {m.retry}
      </Button>
    </div>
  );
}
