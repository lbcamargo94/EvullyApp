import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-sm border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-invalid:border-danger disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'min-h-11 w-full rounded-sm border border-border bg-surface px-3 text-[15px] text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  );
}
