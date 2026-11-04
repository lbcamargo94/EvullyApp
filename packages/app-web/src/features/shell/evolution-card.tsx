import {
  changeTone,
  evolutionSummary,
  isEmptySummary,
  localDateOf,
  localToday,
  useMeasurementSummary,
  useNutritionHistory,
  useSleepLogs,
  useWeightSummary,
  useWorkoutPlans,
  useWorkoutStats,
  type ChangeTone,
  type EvolutionSummary,
} from '@evully/app-core';
import type { Objective } from '@evully/contracts';
import { Card, TrendBadge } from '@evully/ui';
import type { ReactNode } from 'react';
import { formatDuration } from '../sleep/messages.pt-BR';
import { formatSignedCm, formatSignedRate, shellMessages as m } from './messages.pt-BR';

/** Weight and waist points, and the project objective that colors them. */
function useBody(profileId: string) {
  const { data: weight } = useWeightSummary(profileId);
  const { data: measurements } = useMeasurementSummary(profileId);
  const waist = measurements?.items.find((i) => i.bodyRegion === 'waist');
  return {
    weights: (weight?.series ?? []).map((p) => ({ date: p.date, value: p.weightKg })),
    waist: (waist?.series ?? []).map((p) => ({ date: p.date, value: p.valueCm })),
    objective: weight?.objective ?? measurements?.objective ?? null,
  };
}

/** The records of every module, as the points the summary reads. */
function useEvolution(profileId: string) {
  const { weights, waist, objective } = useBody(profileId);
  const { data: workouts = [] } = useWorkoutStats(profileId);
  const { data: plans = [] } = useWorkoutPlans(profileId);
  const { data: nutrition = [] } = useNutritionHistory(profileId);
  const { data: nights = [] } = useSleepLogs(profileId);
  const summary = evolutionSummary(
    {
      weights,
      waist,
      workouts: workouts.map((w) => ({
        date: localDateOf(w.startedAt),
        value: w.exercises.reduce((sum, e) => sum + e.volumeKg, 0),
      })),
      plannedWeekdays: plans
        .filter((p) => p.status === 'active')
        .flatMap((p) => p.days.flatMap((d) => (d.weekday === null ? [] : [d.weekday]))),
      protein: nutrition.map((d) => ({ date: d.date, value: d.proteinG })),
      sleep: nights.map((n) => ({ date: n.sleepDate, value: n.durationMinutes })),
    },
    localToday(),
  );
  return { summary, objective };
}

interface Line {
  label: string;
  value: ReactNode;
}

function bodyLines(summary: EvolutionSummary, objective: Objective | null): Line[] {
  const lines: Line[] = [];
  const badge = (tone: ChangeTone, text: string) => <TrendBadge tone={tone}>{text}</TrendBadge>;
  if (summary.weightRatePerWeek !== null) {
    const rate = summary.weightRatePerWeek;
    lines.push({
      label: m.evolutionWeight,
      value: badge(changeTone(rate, 'weight', objective), formatSignedRate(rate)),
    });
  }
  if (summary.waistChangeCm !== null) {
    const change = summary.waistChangeCm;
    lines.push({
      label: m.evolutionWaist,
      value: badge(changeTone(change, 'waist', objective), formatSignedCm(change)),
    });
  }
  return lines;
}

function activityLines(summary: EvolutionSummary): Line[] {
  const lines: Line[] = [];
  const { workouts, proteinAverageG, sleepAverageMinutes, performance } = summary;
  if (workouts) {
    lines.push({
      label: m.evolutionWorkouts,
      value: m.workoutsDone(workouts.done, workouts.planned),
    });
  }
  if (proteinAverageG !== null) {
    lines.push({ label: m.evolutionProtein, value: m.proteinPerDay(proteinAverageG) });
  }
  if (sleepAverageMinutes !== null) {
    lines.push({ label: m.evolutionSleep, value: formatDuration(sleepAverageMinutes) });
  }
  if (performance) {
    lines.push({ label: m.evolutionPerformance, value: m.performance[performance] });
  }
  return lines;
}

/**
 * "Últimos 14 dias" on the dashboard (README §13.3): objective numbers from
 * the records, never advice. Each line only with enough data for it.
 */
export function EvolutionCard({ profileId }: { profileId: string }) {
  const { summary, objective } = useEvolution(profileId);
  if (isEmptySummary(summary)) return null;
  const lines = [...bodyLines(summary, objective), ...activityLines(summary)];

  return (
    <Card aria-labelledby="evolution-title" className="gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="evolution-title" className="text-lg font-semibold">
          {m.evolutionTitle}
        </h2>
        <p className="text-sm text-text-muted">{m.evolutionHint}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
        {lines.map((line) => (
          <div key={line.label} className="flex flex-col items-start gap-1">
            <dt className="text-sm text-text-muted">{line.label}</dt>
            <dd className="font-semibold tabular-nums">{line.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
