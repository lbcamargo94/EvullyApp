import {
  formatCm,
  formatKg,
  inPeriod,
  isStepsHabit,
  localToday,
  parseLocalDate,
  periodStart,
  useActiveProject,
  useCardioOverview,
  useCurrentProfile,
  useHabitHistory,
  useHabits,
  useMeasurementSummary,
  useNutritionHistory,
  useSleepLogs,
  useSleepTarget,
  useWeightSummary,
  useWorkoutStats,
  weeklyAverages,
  weeklyRates,
  STATS_PERIODS,
  type LocalDate,
  type StatsPeriod,
} from '@evully/app-core';
import type {
  MeasurementSummary,
  NutritionHistory,
  SleepLogDto,
  WeightSummary,
} from '@evully/contracts';
import { useState } from 'react';
import { formatDuration } from '../sleep/messages.pt-BR';
import { CardioChart, StepsChart, WorkoutCharts } from './activity-charts';
import { formatRate, formatWhole, statsMessages as m } from './messages.pt-BR';
import { StatChart, type From } from './stat-chart';

const kg = formatKg;
const hours = (minutes: number) => `${Math.round(minutes / 60)}h`;

/** Statistics (README §13.2): one chart per indicator, all in the same period. */
export function StatsScreen() {
  const { profileId } = useCurrentProfile();
  const { data: project } = useActiveProject(profileId);
  const projectStart = project?.startDate ?? null;
  const [chosen, setChosen] = useState<StatsPeriod | null>(null);
  const period = chosen ?? (projectStart ? 'project' : 'days90');
  if (!profileId) return null;
  const today = localToday();
  const from = periodStart(period, today, projectStart ? parseLocalDate(projectStart) : null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold">{m.title}</h1>
        <div
          role="group"
          aria-label={m.periodLabel}
          className="flex gap-1 rounded-md bg-surface-muted p-1"
        >
          {STATS_PERIODS.filter((p) => p !== 'project' || projectStart).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => setChosen(p)}
              className={
                period === p
                  ? 'min-h-8 rounded-sm bg-surface px-3 text-[13px] font-semibold shadow-sm'
                  : 'min-h-8 rounded-sm px-3 text-[13px] font-semibold text-text-muted'
              }
            >
              {m.periods[p]}
            </button>
          ))}
        </div>
      </div>
      <StatsCharts profileId={profileId} from={from} today={today} />
    </>
  );
}

function useBodyData(profileId: string) {
  const { data: weight } = useWeightSummary(profileId);
  const { data: measurements } = useMeasurementSummary(profileId);
  return {
    weighed: weight?.series.length ? weight : null,
    measured: measurements?.items.filter((i) => i.series.length > 0) ?? [],
  };
}

function useActivityData(profileId: string) {
  const { data: cardio } = useCardioOverview(profileId);
  const { data: habits = [] } = useHabits(profileId);
  const stepsHabit = habits.find(isStepsHabit);
  const { data: steps = [] } = useHabitHistory(profileId, stepsHabit?.id ?? null);
  return {
    cardioSessions: cardio?.weeks.flatMap((w) => w.sessions) ?? [],
    cardioTarget: cardio?.target?.minutesPerWeek ?? null,
    stepsHabit,
    steps,
  };
}

/** What each module has recorded; every chart is built only from its own part. */
function useStatsData(profileId: string) {
  const { data: nutrition = [] } = useNutritionHistory(profileId);
  const { data: nights = [] } = useSleepLogs(profileId);
  const { data: workouts = [] } = useWorkoutStats(profileId);
  return {
    ...useBodyData(profileId),
    ...useActivityData(profileId),
    nutrition,
    nights,
    workouts,
  };
}

/** A chart only for the modules with records; a hint when there is nothing at all. */
function StatsCharts({
  profileId,
  from,
  today,
}: {
  profileId: string;
  from: From;
  today: LocalDate;
}) {
  const data = useStatsData(profileId);
  const any = [
    data.measured,
    data.nutrition,
    data.nights,
    data.workouts,
    data.cardioSessions,
    data.steps,
  ].some((records) => records.length > 0);
  if (!any && !data.weighed) return <p className="text-text-muted">{m.emptyAll}</p>;

  return (
    <div className="grid gap-5 sm:grid-cols-[repeat(auto-fit,minmax(420px,1fr))]">
      {data.weighed && <WeightCharts summary={data.weighed} from={from} />}
      <MeasurementChart items={data.measured} from={from} />
      <NutritionCharts history={data.nutrition} from={from} />
      <SleepChart profileId={profileId} nights={data.nights} from={from} />
      <WorkoutCharts stats={data.workouts} from={from} today={today} />
      <CardioChart
        sessions={data.cardioSessions}
        target={data.cardioTarget}
        from={from}
        today={today}
      />
      <StepsChart habit={data.stepsHabit} history={data.steps} from={from} />
    </div>
  );
}

/** Daily weight and moving average, weekly averages and the speed of change. */
function WeightCharts({ summary, from }: { summary: WeightSummary; from: From }) {
  const series = inPeriod(summary.series, from);
  const weeks = weeklyAverages(series.map((p) => ({ date: p.date, value: p.weightKg })));
  const rates = weeklyRates(weeks);
  return (
    <>
      <StatChart
        id="stats-weight"
        title={m.weightTitle}
        data={series.map((p) => ({ date: p.date, weightKg: p.weightKg, trend: p.trend }))}
        series={[
          { key: 'weightKg', name: m.weightDaily, kind: 'dots' },
          { key: 'trend', name: m.weightTrend, kind: 'line' },
        ]}
        format={kg}
        axisFormat={(v) => formatWhole(v)}
      />
      <StatChart
        id="stats-weekly"
        title={m.weeklyTitle}
        data={weeks.map((w) => ({ date: w.weekStart, average: w.average }))}
        series={[{ key: 'average', name: m.weeklyAverage, kind: 'connected' }]}
        format={kg}
        axisFormat={(v) => formatWhole(v)}
        weekly
      />
      <StatChart
        id="stats-rate"
        title={m.rateTitle}
        hint={m.rateHint}
        data={rates.map((r) => ({ date: r.weekStart, rate: r.ratePerWeek }))}
        series={[{ key: 'rate', name: m.rate, kind: 'bar' }]}
        format={formatRate}
        axisFormat={(v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
        weekly
        zeroLine
      />
    </>
  );
}

function MeasurementChart({ items, from }: { items: MeasurementSummary['items']; from: From }) {
  const [selected, setSelected] = useState<string | null>(null);
  const item =
    items.find((i) => i.id === selected) ?? items.find((i) => i.bodyRegion === 'waist') ?? items[0];
  if (!item) return null;
  return (
    <StatChart
      id="stats-measurements"
      title={m.measurementsTitle}
      action={
        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">{m.measurementLabel}</span>
          <select
            value={item.id}
            onChange={(e) => setSelected(e.target.value)}
            className="min-h-9 rounded-md border border-border bg-surface px-2 text-text"
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      }
      data={inPeriod(item.series, from).map((p) => ({ date: p.date, value: p.valueCm }))}
      series={[{ key: 'value', name: item.name, kind: 'connected' }]}
      format={formatCm}
      axisFormat={(v) => formatWhole(v)}
    />
  );
}

function NutritionCharts({ history, from }: { history: NutritionHistory; from: From }) {
  if (history.length === 0) return null;
  const days = inPeriod(history, from);
  return (
    <>
      <StatChart
        id="stats-calories"
        title={m.caloriesTitle}
        hint={m.nutritionHint}
        data={days.map((d) => ({
          date: d.date,
          value: d.caloriesKcal,
          target: d.targetCaloriesKcal,
        }))}
        series={[
          { key: 'value', name: m.calories, kind: 'bar' },
          { key: 'target', name: m.target, kind: 'target' },
        ]}
        format={(v) => `${formatWhole(v)} kcal`}
        axisFormat={(v) => formatWhole(v)}
        fromZero
      />
      <StatChart
        id="stats-protein"
        title={m.proteinTitle}
        hint={m.nutritionHint}
        data={days.map((d) => ({ date: d.date, value: d.proteinG, target: d.targetProteinG }))}
        series={[
          { key: 'value', name: m.protein, kind: 'bar' },
          { key: 'target', name: m.target, kind: 'target' },
        ]}
        format={(v) => `${formatWhole(v)} g`}
        axisFormat={(v) => formatWhole(v)}
        fromZero
      />
    </>
  );
}

/** Nights of the period, oldest first, against today's target. */
function SleepChart({
  profileId,
  nights,
  from,
}: {
  profileId: string;
  nights: SleepLogDto[];
  from: From;
}) {
  const { data: target = null } = useSleepTarget(profileId);
  if (nights.length === 0) return null;
  const all = nights.map((n) => ({
    date: n.sleepDate,
    value: n.durationMinutes,
    target: target?.minutesPerNight ?? null,
  }));
  const data = inPeriod(all, from).reverse();
  return (
    <StatChart
      id="stats-sleep"
      title={m.sleepTitle}
      data={data}
      series={[
        { key: 'value', name: m.sleep, kind: 'bar' },
        ...(target ? [{ key: 'target', name: m.target, kind: 'target' as const }] : []),
      ]}
      format={formatDuration}
      axisFormat={hours}
      fromZero
    />
  );
}
