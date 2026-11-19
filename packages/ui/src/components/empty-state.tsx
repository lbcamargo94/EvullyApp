import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/**
 * A list, chart or section with nothing to show yet, with an optional action
 * (DESIGN.md §4). With an `illustration` (DESIGN.md §4.3) and a `title` it
 * becomes the module's first-use state; without them it stays a short line.
 */
export function EmptyState({
  children,
  title,
  illustration,
  action,
  className,
}: {
  children: ReactNode;
  title?: string;
  illustration?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-dashed border-border px-4 py-6 text-center text-body text-text-muted',
        illustration && 'gap-2 py-8',
        className,
      )}
    >
      {illustration && (
        <div className="mb-2 w-50 max-w-full [&>svg]:h-auto [&>svg]:w-full">{illustration}</div>
      )}
      {title && <h3 className="text-heading font-semibold text-text">{title}</h3>}
      <p className={illustration ? 'max-w-sm' : undefined}>{children}</p>
      {action}
    </div>
  );
}
