import { cn } from '../lib/utils';

const sizes = { sm: 'size-8 text-sm', lg: 'size-22 text-[34px]' } as const;

/** Initial-letter avatar. Never shows personal data (README §8.1). */
export function Avatar({
  initial,
  size = 'sm',
  className,
}: {
  initial: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-soft-foreground',
        sizes[size],
        className,
      )}
    >
      {initial}
    </span>
  );
}
