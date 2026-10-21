import { changeTone, formatChange, formatCm } from '@evully/app-core';
import type { MeasurementSummary } from '@evully/contracts';
import { StatCard, TrendBadge } from '@evully/ui';
import { measurementMessages as m } from './messages.pt-BR';

/** Dashboard shows up to 3 measurements, first in the profile's order (README §8.5). */
export const DASHBOARD_MEASUREMENTS = 3;

/** Without data an indicator says so instead of showing zero (README §8.5). */
export function MeasurementCards({ summary }: { summary: MeasurementSummary }) {
  return summary.items.slice(0, DASHBOARD_MEASUREMENTS).map((item) => (
    <StatCard
      key={item.id}
      label={item.name}
      value={item.current ? formatCm(item.current.valueCm) : m.insufficient}
      badge={
        item.change !== null && (
          <>
            <TrendBadge tone={changeTone(item.change, item.bodyRegion, summary.objective)}>
              {formatChange(item.change, 'cm')}
            </TrendBadge>
            <span className="text-sm text-text-muted">{m.sinceStart}</span>
          </>
        )
      }
      footnote={!item.current ? m.noDataHint : item.change === null ? m.firstValueHint : undefined}
    />
  ));
}
