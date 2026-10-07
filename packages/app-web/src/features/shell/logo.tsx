import { TrendingUp } from 'lucide-react';
import { cn } from '@evully/ui';

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-md bg-brand text-brand-foreground',
          lg ? 'size-10' : 'size-8',
        )}
      >
        <TrendingUp aria-hidden="true" className={lg ? 'size-5.5' : 'size-4.5'} strokeWidth={2.4} />
      </span>
      <span className={cn('font-bold tracking-tight', lg ? 'text-[26px]' : 'text-[19px]')}>
        Evully
      </span>
    </div>
  );
}
