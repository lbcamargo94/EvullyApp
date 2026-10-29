import { useSleepTarget, type SleepIndicators } from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { useState } from 'react';
import { formatClock, formatDuration, sleepMessages as m } from './messages.pt-BR';
import { SleepTargetForm } from './sleep-target';

/**
 * README §12.2: averages, mean clock times and consistency over the recent
 * nights, plus the nightly target (§13.1).
 */
export function SleepIndicatorsCard({
  profileId,
  indicators,
}: {
  profileId: string;
  indicators: SleepIndicators;
}) {
  const { data: target = null } = useSleepTarget(profileId);
  const [editingTarget, setEditingTarget] = useState(false);
  const { last7, last30, bedtime, wakeTime, consistency } = indicators;
  const rows: [string, string, string | null][] = [
    [
      m.average7,
      last7.minutes === null ? '—' : formatDuration(last7.minutes),
      m.nights(last7.nights),
    ],
    [
      m.average30,
      last30.minutes === null ? '—' : formatDuration(last30.minutes),
      m.nights(last30.nights),
    ],
    [m.meanBedtime, bedtime === null ? '—' : formatClock(bedtime), null],
    [m.meanWakeTime, wakeTime === null ? '—' : formatClock(wakeTime), null],
    [m.consistency, consistency === null ? '—' : m.deviation(consistency), m.consistencyHint],
  ];
  if (target) rows.push([m.target, formatDuration(target.minutesPerNight ?? 0), null]);

  return (
    <Card aria-labelledby="sleep-indicators-title" className="flex-[1_1_280px] gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sleep-indicators-title" className="text-lg font-semibold">
          {m.indicators}
        </h2>
        {!editingTarget && (
          <Button
            type="button"
            variant="ghost"
            className="min-h-9 px-2"
            onClick={() => setEditingTarget(true)}
          >
            {target ? m.targetEdit : m.targetSet}
          </Button>
        )}
      </div>
      {editingTarget && (
        <SleepTargetForm
          profileId={profileId}
          target={target}
          onDone={() => setEditingTarget(false)}
        />
      )}
      <dl className="flex flex-col gap-2">
        {rows.map(([label, value, hint]) => (
          <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-3">
            <dt className="text-sm text-text-muted">
              {label}
              {hint && <span className="ml-1.5 text-xs">({hint})</span>}
            </dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
