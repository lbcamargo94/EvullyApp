import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

export type BadgeTone = 'brand' | 'positive' | 'caution' | 'neutral' | 'danger';

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-soft text-brand-soft-foreground',
  positive: 'bg-positive-soft text-positive',
  caution: 'bg-caution-soft text-caution',
  neutral: 'bg-neutral-soft text-neutral',
  danger: 'bg-danger-soft text-danger',
};

/** Short status label. Color is never the only information: the text says it. */
export function Badge({
  tone = 'neutral',
  size = 'md',
  className,
  ...props
}: ComponentProps<'span'> & { tone?: BadgeTone; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold tabular-nums',
        size === 'sm' ? 'px-2 py-0.5 text-caption' : 'px-2.5 py-1 text-caption',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
