import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export type Tone = 'positive' | 'caution' | 'neutral';

const tones: Record<Tone, string> = {
  positive: 'bg-positive-soft text-positive',
  caution: 'bg-caution-soft text-caution',
  neutral: 'bg-neutral-soft text-neutral',
};

/**
 * Change badge colored by the objective's direction (README §7.6). The text
 * always carries arrow and value, so color is never the only information.
 */
export function TrendBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Dashboard indicator: label, main value, change badge and a secondary line. */
export function StatCard({
  label,
  value,
  badge,
  footnote,
  action,
}: {
  label: string;
  value: ReactNode;
  badge?: ReactNode;
  footnote?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">{label}</span>
        {action}
      </div>
      <span className="text-[40px] leading-tight font-semibold tracking-tight tabular-nums">
        {value}
      </span>
      {badge && <div className="flex flex-wrap items-center gap-2.5">{badge}</div>}
      {footnote && <span className="text-sm text-text-muted">{footnote}</span>}
    </section>
  );
}
