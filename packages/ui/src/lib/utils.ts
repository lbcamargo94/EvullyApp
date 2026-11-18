import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge that knows the Evully type scale (DESIGN.md §3.2), so
 * `text-heading` is a font size and does not cancel `text-text-muted`.
 */
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ['display', 'title', 'heading', 'body', 'caption'] } },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
