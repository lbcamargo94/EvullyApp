import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

/**
 * A native checkbox styled with the tokens: keyboard, forms and assistive
 * technology work as usual. Pair it with a <label> (or aria-label).
 */
export function Checkbox({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'size-5 shrink-0 cursor-pointer rounded-sm accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

/**
 * An on/off setting that applies at once: a native checkbox with
 * role="switch", drawn as a track and a thumb.
 */
export function Switch({ className, ...props }: Omit<ComponentProps<'input'>, 'type' | 'role'>) {
  return (
    <input
      type="checkbox"
      role="switch"
      className={cn(
        'relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-border transition-colors',
        "before:absolute before:top-0.5 before:left-0.5 before:size-5 before:rounded-full before:bg-surface before:shadow-sm before:transition-transform before:content-['']",
        'checked:bg-brand checked:before:translate-x-5',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:before:transition-none',
        className,
      )}
      {...props}
    />
  );
}
