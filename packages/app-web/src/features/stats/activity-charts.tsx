import {
  exerciseLoads,
  formatKg,
  inPeriod,
  localDateOf,
  weeklyTotals,
  type LocalDate,
} from '@evully/app-core';
import type { CardioSessionDto, HabitDto, HabitHistory, WorkoutStats } from '@evully/contracts';
import { useState } from 'react';
import { formatWhole, statsMessages as m } from './messages.pt-BR';
import { StatChart, type From } from './stat-chart';

const sumOf = (values: number[]) => values.reduce((total, v) => total + v, 0);

/** Volume and frequency per week, and the heaviest load per exercise. */
export function WorkoutCharts({
  stats,
  from,
  today,
}: {
  stats: WorkoutStats;
  from: From;
  today: LocalDate;
}) {
  if (stats.length === 0) return null;
  const sessions = inPeriod(
    stats.map((s) => ({ date: localDateOf(s.startedAt), exercises: s.exercises })),
    from,
  );
  const volume = weeklyTotals(
    sessions.map((s) => ({ date: s.date, value: sumOf(s.exercises.map((e) => e.volumeKg)) })),
    today,
  );
  const frequency = weeklyTotals(
    sessions.map((s) => ({ date: s.date, value: 1 })),
    today,
  );
  return (
    <>
      <StatChart
        id="stats-volume"
        title={m.volumeTitle}
        hint={m.volumeHint}
        data={volume.map((w) => ({ date: w.weekStart, value: w.total }))}
        series={[{ key: 'value', name: m.volume, kind: 'bar' }]}
        format={(v) => `${formatWhole(v)} kg`}
        axisFormat={(v) => formatWhole(v)}
        weekly
        fromZero
      />
      <StatChart
        id="stats-frequency"
        title={m.frequencyTitle}
        data={frequency.map((w) => ({ date: w.weekStart, value: w.total }))}
        series={[{ key: 'value', name: m.frequency, kind: 'bar' }]}
        format={m.workouts}
        axisFormat={(v) => formatWhole(v)}
        weekly
        fromZero
        integer
      />
      <LoadChart sessions={sessions} />
    </>
  );
}

function LoadChart({ sessions }: { sessions: Parameters<typeof exerciseLoads>[0] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const exercises = exerciseLoads(sessions);
  const exercise = exercises.find((e) => e.exerciseId === selected) ?? exercises[0];
  return (
    <StatChart
      id="stats-load"
      title={m.loadTitle}
      hint={m.loadHint}
      action={
        exercise && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">{m.exerciseLabel}</span>
            <select
              value={exercise.exerciseId}
              onChange={(e) => setSelected(e.target.value)}
              className="min-h-9 max-w-48 rounded-md border border-border bg-surface px-2 text-text"
            >
              {exercises.map((e) => (
                <option key={e.exerciseId} value={e.exerciseId}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        )
      }
      data={(exercise?.points ?? []).map((p) => ({ date: p.date, value: p.value }))}
      series={[{ key: 'value', name: exercise?.name ?? m.loadTitle, kind: 'connected' }]}
      format={formatKg}
      axisFormat={(v) => formatWhole(v)}
    />
  );
}

/** Minutes per week against the target in force. */
export function CardioChart({
  sessions,
  target,
  from,
  today,
}: {
  sessions: CardioSessionDto[];
  target: number | null;
  from: From;
  today: LocalDate;
}) {
  if (sessions.length === 0) return null;
  const points = sessions.map((s) => ({ date: s.sessionDate, value: s.durationMinutes }));
  const weeks = weeklyTotals(inPeriod(points, from), today);
  return (
    <StatChart
      id="stats-cardio"
      title={m.cardioTitle}
      data={weeks.map((w) => ({ date: w.weekStart, value: w.total, target }))}
      series={[
        { key: 'value', name: m.cardio, kind: 'bar' },
        ...(target ? [{ key: 'target', name: m.target, kind: 'target' as const }] : []),
      ]}
      format={(v) => `${formatWhole(v)} min`}
      axisFormat={(v) => formatWhole(v)}
      weekly
      fromZero
    />
  );
}

/** The day's total from the steps habit, against its target. */
export function StepsChart({
  habit,
  history,
  from,
}: {
  habit: HabitDto | undefined;
  history: HabitHistory;
  from: From;
}) {
  if (!habit || history.length === 0) return null;
  const target = habit.targetValue;
  return (
    <StatChart
      id="stats-steps"
      title={m.stepsTitle}
      data={inPeriod(history, from).map((l) => ({ date: l.date, value: l.value, target }))}
      series={[
        { key: 'value', name: m.steps, kind: 'bar' },
        ...(target ? [{ key: 'target', name: m.target, kind: 'target' as const }] : []),
      ]}
      format={(v) => `${formatWhole(v)} ${m.stepsUnit}`}
      axisFormat={(v) => formatWhole(v)}
      fromZero
    />
  );
}
