import {
  localToday,
  useHabitDay,
  useNutritionDay,
  useNutritionPreferences,
  useSleepLogs,
  useSleepTarget,
} from '@evully/app-core';
import type { NutritionDay } from '@evully/contracts';
import { Card, ProgressBar } from '@evully/ui';
import { Link } from 'react-router';
import { formatNumber } from '../nutrition/messages.pt-BR';
import { formatDuration } from '../sleep/messages.pt-BR';
import { shellMessages as m } from './messages.pt-BR';

interface Row {
  label: string;
  to: string;
  value: number;
  target: number | null;
  format: (value: number) => string;
  /** Shown instead of the value, e.g. before tonight's entry. */
  empty?: boolean;
}

const withUnit = (unit: string | null) => (value: number) =>
  unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);

const dietRow = (label: string, unit: string, value: number, target: number | null): Row => ({
  label,
  to: '/app/diet',
  value,
  target,
  format: withUnit(unit),
});

/** Calories, protein and water, only for profiles that use nutrition (README §9.9). */
function useNutritionRows(profileId: string, today: string): Row[] {
  const { data: day } = useNutritionDay(profileId, today);
  const { data: prefs } = useNutritionPreferences(profileId);
  if (!day) return [];
  const used = day.logs.length > 0 || day.water.logs.length > 0;
  if (!day.target && !used) return [];
  return nutritionRows(day, prefs?.trackWater !== false);
}

function nutritionRows(day: NutritionDay, withWater: boolean): Row[] {
  const { consumed } = day.totals;
  const t = day.target;
  const rows = [
    dietRow(m.calories, 'kcal', consumed.caloriesKcal, t?.caloriesKcal ?? null),
    dietRow(m.protein, 'g', consumed.proteinG, t?.proteinG ?? null),
  ];
  if (withWater) rows.push(dietRow(m.water, 'ml', day.water.totalMl, t?.waterMl ?? null));
  return rows;
}

/** Quantity habits with a target, such as steps (README §11.2). */
function useHabitRows(profileId: string, today: string): Row[] {
  const { data: day } = useHabitDay(profileId, today);
  return (day?.habits ?? [])
    .filter((h) => h.type === 'quantity' && h.targetValue !== null)
    .map((h) => ({
      label: h.name,
      to: '/app/habits',
      value: h.value ?? 0,
      target: h.targetValue,
      format: withUnit(h.unit),
    }));
}

/** The night that ended today against the target (README §12, §13.1). */
function useSleepRows(profileId: string, today: string): Row[] {
  const { data: nights } = useSleepLogs(profileId);
  const { data: target = null } = useSleepTarget(profileId);
  if (!nights || (nights.length === 0 && !target)) return [];
  const night = nights.find((n) => n.sleepDate === today);
  return [
    {
      label: m.sleepTitle,
      to: '/app/sleep',
      value: night?.durationMinutes ?? 0,
      target: target?.minutesPerNight ?? null,
      format: formatDuration,
      empty: !night,
    },
  ];
}

/**
 * "Hoje" on the dashboard (README §13.1): today's numbers against the targets.
 * Each line only for modules the profile uses; the workout has its own card.
 */
export function TodayCard({ profileId }: { profileId: string }) {
  const today = localToday();
  const rows = [
    ...useNutritionRows(profileId, today),
    ...useHabitRows(profileId, today),
    ...useSleepRows(profileId, today),
  ];
  if (rows.length === 0) return null;

  return (
    <Card aria-labelledby="today-title" className="min-w-0 flex-[1_1_280px] gap-4">
      <h2 id="today-title" className="text-heading font-semibold">
        {m.todayTitle}
      </h2>
      <dl className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
        {rows.map((r) => (
          <div key={`${r.to}:${r.label}`} className="flex flex-col gap-1">
            <dt className="text-caption text-text-muted">
              <Link to={r.to} className="underline-offset-4 hover:text-text hover:underline">
                {r.label}
              </Link>
            </dt>
            <dd className="font-semibold tabular-nums">
              {r.empty ? '—' : r.format(r.value)}
              {r.target !== null && ` / ${r.format(r.target)}`}
            </dd>
            {r.target !== null && r.target > 0 && (
              <ProgressBar value={r.value} max={r.target} label={r.label} />
            )}
          </div>
        ))}
      </dl>
    </Card>
  );
}
