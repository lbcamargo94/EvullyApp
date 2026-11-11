import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/** A list, chart or section with nothing to show yet, with an optional action (DESIGN.md §4). */
export function EmptyState({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted',
        className,
      )}
    >
      <p>{children}</p>
      {action}
    </div>
  );
}
