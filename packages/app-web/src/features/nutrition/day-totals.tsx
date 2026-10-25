import type { NutritionDay } from '@evully/contracts';
import { Button, Card, ProgressBar } from '@evully/ui';
import { Link } from 'react-router';
import { dietMessages as m, formatNumber } from './messages.pt-BR';

type Totals = NutritionDay['totals']['planned'];

const ROWS = [
  ['proteinG', 'Proteína', 'g'],
  ['carbohydrateG', 'Carboidratos', 'g'],
  ['fatG', 'Gorduras', 'g'],
] as const;

/** Consumed vs. target (README §9.9); planned is shown beside it. */
export function DayTotals({ day }: { day: NutritionDay }) {
  const { consumed, planned } = day.totals;
  const target = day.target;
  return (
    <Card aria-labelledby="day-totals-title" className="gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="day-totals-title" className="text-base font-semibold">
          {m.totalsTitle}
        </h3>
        <span className="text-sm text-text-muted tabular-nums">
          {m.planned}: {m.kcal(formatNumber(planned.caloriesKcal))}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">{m.consumed}</span>
        <span className="text-[32px] leading-tight font-semibold tabular-nums">
          {target
            ? m.ofTarget(
                formatNumber(consumed.caloriesKcal),
                formatNumber(target.caloriesKcal),
                'kcal',
              )
            : m.kcal(formatNumber(consumed.caloriesKcal))}
        </span>
        {target && (
          <ProgressBar
            value={consumed.caloriesKcal}
            max={target.caloriesKcal}
            label={m.progressOf('kcal')}
          />
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {ROWS.map(([key, label, unit]) => (
          <Macro
            key={key}
            label={label}
            unit={unit}
            value={consumed[key]}
            target={target?.[key] ?? null}
          />
        ))}
      </div>
      {!target && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-muted">{m.noTarget}</p>
          <Button asChild variant="secondary">
            <Link to="/app/settings?tab=nutrition">{m.setTargets}</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}

function Macro({
  label,
  unit,
  value,
  target,
}: {
  label: string;
  unit: string;
  value: Totals[keyof Totals];
  target: number | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="font-semibold tabular-nums">
        {target === null
          ? `${formatNumber(value)} ${unit}`
          : m.ofTarget(formatNumber(value), formatNumber(target), unit)}
      </span>
      {target !== null && target > 0 && (
        <ProgressBar value={value} max={target} label={m.progressOf(label)} />
      )}
    </div>
  );
}
