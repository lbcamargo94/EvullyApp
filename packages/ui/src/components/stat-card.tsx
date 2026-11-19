import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/**
 * Dashboard indicator: label, main value, change badge and a secondary line.
 * `insufficient` shows the value as a muted heading ("Dados insuficientes"),
 * never at metric size, so it does not read as a number.
 */
export function StatCard({
  label,
  value,
  badge,
  footnote,
  action,
  insufficient = false,
}: {
  label: string;
  value: ReactNode;
  badge?: ReactNode;
  footnote?: ReactNode;
  action?: ReactNode;
  insufficient?: boolean;
}) {
  return (
    <section
      aria-label={label}
      className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-6 shadow-card"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-body font-semibold">{label}</span>
        {action}
      </div>
      <span
        className={cn(
          'font-semibold',
          insufficient
            ? 'text-heading text-text-muted'
            : 'text-display tracking-tight tabular-nums',
        )}
      >
        {value}
      </span>
      {badge && <div className="flex flex-wrap items-center gap-2.5">{badge}</div>}
      {footnote && <span className="text-caption text-text-muted">{footnote}</span>}
    </section>
  );
}
