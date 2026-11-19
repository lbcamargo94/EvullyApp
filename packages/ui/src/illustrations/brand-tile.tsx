import type { ReactNode } from 'react';

/**
 * Frame of every Evully illustration, style "Selo da marca" (DESIGN.md §4.3):
 * a brand tile, tilted like a sticker, over a brand-soft tile turned the other
 * way, with small sparkles. The module symbol is drawn by `children` in the
 * tile's own 88 × 88 box, in brand-foreground with brand cut-outs, as in the
 * app icon. Only tokens, so it follows the theme; always decorative.
 */
export function BrandTile({
  tilt = -6,
  className,
  children,
}: {
  /** Degrees; the back tile turns twice as far the other way. */
  tilt?: number;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true" className={className}>
      <rect
        x="58"
        y="26"
        width="84"
        height="84"
        rx="22"
        transform={`translate(${tilt < 0 ? 16 : -16} 0) rotate(${-tilt * 2} 100 68)`}
        className="fill-brand-soft"
      />
      <g transform={`rotate(${tilt} 100 70) translate(56 26)`}>
        <rect width="88" height="88" rx="24" className="fill-brand" />
        {children}
      </g>
      <path
        d="M164 34v8M160 38h8M38 98v6M35 101h6"
        strokeWidth="3"
        strokeLinecap="round"
        className="fill-none stroke-brand"
      />
      <circle cx="170" cy="98" r="3.5" className="fill-brand" />
      <circle cx="34" cy="40" r="2.5" className="fill-brand opacity-50" />
    </svg>
  );
}
