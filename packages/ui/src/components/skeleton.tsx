import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

/** Placeholder while content loads; hidden from screen readers, still under reduced motion. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}
