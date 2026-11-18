import { cn } from '@evully/ui';

/** Dumbbell plates and bar, drawn twice: a brand-colored halo, then the shape. */
const DUMBBELL = [
  { x: 10, y: 44.25, width: 32, height: 3.5, rx: 1.75 },
  { x: 12, y: 38, width: 5.5, height: 16, rx: 2.5 },
  { x: 34.5, y: 38, width: 5.5, height: 16, rx: 2.5 },
  { x: 7.5, y: 41.5, width: 4, height: 9, rx: 2 },
  { x: 40.5, y: 41.5, width: 4, height: 9, rx: 2 },
];

/**
 * The Evully mark: a heart with a pulse (well-being), a leaf (nutrition) and
 * a dumbbell (training). Drawn with tokens, so it follows the theme; the app
 * icon (apps/desktop/build/icon.svg) uses the same shape.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="16" className="fill-brand" />
      <path
        d="M32 51C17 41 11 33 11 25.5 11 19 15.5 14.5 21.5 14.5 26 14.5 29.5 17 32 21 34.5 17 38 14.5 42.5 14.5 48.5 14.5 53 19 53 25.5 53 33 47 41 32 51Z"
        transform="translate(5 0) scale(.87)"
        className="fill-brand-foreground"
      />
      <path
        d="M34 19C34.5 11.5 39.5 7 47 7 47 14 42 19 34 19Z"
        strokeWidth="2.5"
        paintOrder="stroke"
        className="fill-brand-foreground stroke-brand"
      />
      <path
        d="M14 27h9l3-6 4 10 3-7h15"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-brand"
      />
      <g transform="rotate(-14 30 44)">
        <g strokeWidth="5" strokeLinejoin="round" className="fill-brand stroke-brand">
          {DUMBBELL.map((r) => (
            <rect key={r.x} {...r} />
          ))}
        </g>
        <g className="fill-brand-foreground">
          {DUMBBELL.map((r) => (
            <rect key={r.x} {...r} />
          ))}
        </g>
      </g>
    </svg>
  );
}

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={lg ? 'size-10' : 'size-8'} />
      <span className={cn('font-bold tracking-tight', lg ? 'text-title' : 'text-heading')}>
        Evully
      </span>
    </div>
  );
}
