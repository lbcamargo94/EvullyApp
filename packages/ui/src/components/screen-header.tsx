import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/**
 * The top of every screen (DESIGN.md §4): the screen title (the page's only
 * `<h1>`), an optional short description and the screen's own actions.
 */
export function ScreenHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-title tracking-tight">{title}</h1>
        {description && <p className="text-body text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
