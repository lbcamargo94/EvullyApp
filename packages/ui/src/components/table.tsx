import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

/**
 * Data table with the Evully look: no outer frame (it sits in a Card), a
 * header line and soft row dividers; numbers align with tabular figures.
 * Scrolls sideways instead of squeezing columns.
 */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn('w-full border-collapse text-left tabular-nums', className)}
        {...props}
      />
    </div>
  );
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return <tr className={cn('border-b border-border/60 text-body', className)} {...props} />;
}

export function TableHeader({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-border px-3 py-2.5 text-caption font-semibold text-text-muted',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('px-3 py-3', className)} {...props} />;
}
