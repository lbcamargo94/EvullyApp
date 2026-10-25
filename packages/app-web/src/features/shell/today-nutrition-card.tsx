import { localToday, useNutritionDay } from '@evully/app-core';
import { Card, ProgressBar } from '@evully/ui';
import { Link } from 'react-router';
import { formatNumber } from '../nutrition/messages.pt-BR';
import { shellMessages as m } from './messages.pt-BR';

/** "Hoje" on the dashboard (README §9.9): calories, protein and water against the targets. */
export function TodayNutritionCard({ profileId }: { profileId: string }) {
  const { data: day } = useNutritionDay(profileId, localToday());
  if (!day) return null;
  const used = day.logs.length > 0 || day.water.logs.length > 0;
  if (!day.target && !used) return null; // the profile does not use nutrition yet

  const t = day.target;
  const rows = [
    [m.calories, 'kcal', day.totals.consumed.caloriesKcal, t?.caloriesKcal ?? null],
    [m.protein, 'g', day.totals.consumed.proteinG, t?.proteinG ?? null],
    [m.water, 'ml', day.water.totalMl, t?.waterMl ?? null],
  ] as const;

  return (
    <Card aria-labelledby="today-nutrition-title" className="gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="today-nutrition-title" className="text-lg font-semibold">
          {m.todayTitle}
        </h2>
        <Link
          to="/app/diet"
          className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          {m.openDiet}
        </Link>
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {rows.map(([label, unit, value, target]) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-sm text-text-muted">{label}</dt>
            <dd className="font-semibold tabular-nums">
              {formatNumber(value)}
              {target !== null && ` / ${formatNumber(target)}`} {unit}
            </dd>
            {target !== null && target > 0 && (
              <ProgressBar value={value} max={target} label={label} />
            )}
          </div>
        ))}
      </dl>
    </Card>
  );
}
