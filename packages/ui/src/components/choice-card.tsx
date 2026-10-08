import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

/**
 * Large selectable option (radio or checkbox semantics). Selection is shown by
 * border, background and `aria-checked`, never by color alone.
 */
export function ChoiceCard({
  checked,
  multiple = false,
  title,
  description,
  className,
  ...props
}: Omit<ComponentProps<'button'>, 'role' | 'title'> & {
  checked: boolean;
  multiple?: boolean;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={checked}
      className={cn(
        'flex flex-col items-start gap-1 rounded-md p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        checked
          ? 'border-2 border-brand bg-brand-soft'
          : 'border border-border bg-surface hover:border-brand/60',
        className,
      )}
      {...props}
    >
      <span className="text-base font-semibold text-text">{title}</span>
      {description && <span className="text-sm text-text-muted">{description}</span>}
    </button>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = Math.round((Math.min(value, max) / max) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
    </div>
  );
}
