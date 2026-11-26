import { markerHistories, markerLevel } from '@evully/app-core';
import type { HealthExamDto } from '@evully/contracts';
import { Badge, Card, EmptyState, cn } from '@evully/ui';
import { useMemo, useState } from 'react';
import { MarkerDetail } from './marker-detail';
import { formatExamDate, formatValue, levelLabels, markerMessages as m } from './messages.pt-BR';

/** Every marker typed so far, with its last result and level (README §24.3). */
export function HealthMarkers({ exams }: { exams: HealthExamDto[] }) {
  const histories = useMemo(() => markerHistories(exams), [exams]);
  const [selected, setSelected] = useState<string | null>(null);
  const current = histories.find((h) => h.key === selected) ?? histories[0];

  if (!current)
    return (
      <Card>
        <EmptyState title={m.emptyTitle}>{m.empty}</EmptyState>
      </Card>
    );

  return (
    <div className="flex flex-wrap items-start gap-4">
      <Card aria-labelledby="marker-list-title" className="min-w-0 flex-[1_1_260px] gap-2">
        <h2 id="marker-list-title" className="text-heading font-semibold">
          {m.list}
        </h2>
        <ul className="flex flex-col gap-1">
          {histories.map((h) => {
            const last = h.points.at(-1);
            const level = markerLevel(h.points);
            const active = h.key === current.key;
            return (
              <li key={h.key}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(h.key)}
                  className={cn(
                    'flex w-full flex-col items-start gap-1 rounded-md px-3 py-2 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                    active && 'bg-brand-soft',
                  )}
                >
                  <span className="font-semibold">{h.name}</span>
                  {last && (
                    <span className="text-caption text-text-muted tabular-nums">
                      {m.last(
                        `${formatValue(last.value)} ${last.unit}`,
                        formatExamDate(last.collectedOn),
                      )}
                    </span>
                  )}
                  {level !== 'informative' && (
                    <Badge size="sm" tone="caution">
                      {levelLabels[level]}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
      <MarkerDetail key={current.key} history={current} />
    </div>
  );
}
