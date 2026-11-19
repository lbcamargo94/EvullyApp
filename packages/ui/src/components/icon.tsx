import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

/** The three icon sizes (DESIGN.md §4.2): 16 px inline, 20 px menu and headers, 24 px emphasis. */
const sizes = { sm: 'size-4', md: 'size-5', lg: 'size-6' } as const;

export type IconSize = keyof typeof sizes;

/**
 * Lucide icon with the Evully size and a 2 px stroke. Decorative by default
 * (`aria-hidden`); with `label` it is announced as an image.
 */
export function Icon({
  icon: Glyph,
  size = 'sm',
  label,
  className,
}: {
  icon: LucideIcon;
  size?: IconSize;
  label?: string;
  className?: string;
}) {
  return (
    <Glyph
      strokeWidth={2}
      className={cn(sizes[size], 'shrink-0', className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  );
}
