import { changeTone, formatChange, formatKg, formatLocalDate } from '@evully/app-core';
import type { WeightDisplay, WeightSummary } from '@evully/contracts';
import { StatCard, TrendBadge } from '@evully/ui';
import { weightMessages as m } from './messages.pt-BR';

/**
 * Weight indicator as chosen in the questionnaire (README §8.2.2): trend or
 * today's weight as the main number. Nothing is shown when the user hides it.
 */
export function WeightSummaryCard({
  summary,
  display,
}: {
  summary: WeightSummary;
  display: WeightDisplay;
}) {
  if (display === 'hidden' || !summary.current) return null;

  const showTrend = display === 'trend' && summary.trend !== null;
  const main = showTrend ? summary.trend : summary.current.weightKg;
  const change = showTrend ? summary.trendChange : summary.change;
  const label = display === 'trend' ? m.trend : m.current;
  const secondary = footnoteFor(summary, summary.current, display, showTrend);

  return (
    <StatCard
      label={label}
      value={main === null ? m.insufficient : formatKg(main)}
      badge={
        change !== null &&
        summary.start && (
          <>
            <TrendBadge tone={changeTone(change, 'weight', summary.objective)}>
              {formatChange(change, 'kg')}
            </TrendBadge>
            <span className="text-sm text-text-muted">
              {m.sinceStart} ({formatKg(summary.start.weightKg)})
            </span>
          </>
        )
      }
      footnote={secondary}
    />
  );
}

function footnoteFor(
  summary: WeightSummary,
  current: NonNullable<WeightSummary['current']>,
  display: WeightDisplay,
  showTrend: boolean,
): string {
  const last = `${m.lastWeighing}: ${formatKg(current.weightKg)} · ${formatLocalDate(current.date)}`;
  if (showTrend) return last;
  if (display === 'trend') return m.insufficientHint;
  return summary.trend !== null ? `${m.trend}: ${formatKg(summary.trend)}` : last;
}
