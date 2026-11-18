import type { ReactNode } from 'react';

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
      className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-6 shadow-card"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-body font-semibold">{label}</span>
        {action}
      </div>
      <span className="text-display font-semibold tracking-tight tabular-nums">{value}</span>
      {badge && <div className="flex flex-wrap items-center gap-2.5">{badge}</div>}
      {footnote && <span className="text-sm text-text-muted">{footnote}</span>}
    </section>
  );
}
