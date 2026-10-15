import { changeTone, formatChange, formatCm } from '@evully/app-core';
import type { MeasurementSummary } from '@evully/contracts';
import { StatCard, TrendBadge } from '@evully/ui';
import { measurementMessages as m } from './messages.pt-BR';

/** Dashboard shows up to 3 measurements, first in the profile's order (README §8.5). */
export const DASHBOARD_MEASUREMENTS = 3;

export function MeasurementCards({ summary }: { summary: MeasurementSummary }) {
  const items = summary.items.filter((i) => i.current).slice(0, DASHBOARD_MEASUREMENTS);
  return items.map((item) => (
    <StatCard
      key={item.id}
      label={item.name}
      value={item.current ? formatCm(item.current.valueCm) : ''}
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
    />
  ));
}
