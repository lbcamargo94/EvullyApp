import {
  errorCode,
  isoWeekday,
  localToday,
  useHabitDay,
  useNutritionDay,
  useNutritionPreferences,
  useOpenSession,
  useSessionMutation,
  useSleepLogs,
  useSleepTarget,
  useWorkoutPlans,
} from '@evully/app-core';
import type { NutritionDay, WorkoutPlanDto, WorkoutSessionDto } from '@evully/contracts';
import { Button, Card, ProgressBar } from '@evully/ui';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { formatNumber } from '../nutrition/messages.pt-BR';
import { formatDuration } from '../sleep/messages.pt-BR';
import { sessionErrorByCode } from '../workouts/messages.pt-BR';
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

interface TodayWorkout {
  session: WorkoutSessionDto | null;
  planned: { plan: string; day: WorkoutPlanDto['days'][number] }[];
}

/** The open session or today's days of the active plans; null when no plan has weekdays. */
function useTodayWorkout(profileId: string, today: string): TodayWorkout | null {
  const { data: plans = [] } = useWorkoutPlans(profileId);
  const { data: session = null } = useOpenSession(profileId);
  const active = plans.filter((p) => p.status === 'active');
  const scheduled = active.some((p) => p.days.some((d) => d.weekday !== null));
  if (!session && !scheduled) return null;
  const weekday = isoWeekday(today);
  const planned = active.flatMap((p) =>
    p.days.filter((d) => d.weekday === weekday).map((day) => ({ plan: p.name, day })),
  );
  return { session, planned };
}

/**
 * "Hoje" on the dashboard (README §13.1): today's numbers against the targets
 * and the planned workout. Each line only for modules the profile uses.
 */
export function TodayCard({ profileId }: { profileId: string }) {
  const today = localToday();
  const rows = [
    ...useNutritionRows(profileId, today),
    ...useHabitRows(profileId, today),
    ...useSleepRows(profileId, today),
  ];
  const workout = useTodayWorkout(profileId, today);
  if (rows.length === 0 && !workout) return null;

  return (
    <Card aria-labelledby="today-title" className="gap-4">
      <h2 id="today-title" className="text-lg font-semibold">
        {m.todayTitle}
      </h2>
      {rows.length > 0 && (
        <dl className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {rows.map((r) => (
            <div key={`${r.to}:${r.label}`} className="flex flex-col gap-1">
              <dt className="text-sm text-text-muted">
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
      )}
      {workout && <WorkoutSection profileId={profileId} workout={workout} />}
    </Card>
  );
}

function WorkoutSection({ profileId, workout }: { profileId: string; workout: TodayWorkout }) {
  const start = useSessionMutation(profileId, (api, pid, dayId: string) => api.start(pid, dayId));
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { session, planned } = workout;

  const begin = async (dayId: string) => {
    try {
      await start.mutateAsync(dayId);
      void navigate('/app/workouts?tab=session');
    } catch (e) {
      setError(sessionErrorByCode[errorCode(e) ?? ''] ?? m.workoutError);
    }
  };

  return (
    <section
      aria-labelledby="today-workout-title"
      className="flex flex-col gap-2 border-t border-border pt-3"
    >
      <h3 id="today-workout-title" className="text-sm text-text-muted">
        {m.workoutTitle}
      </h3>
      {session ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">
            {m.workoutInProgress(session.dayName ?? m.freeWorkout)}
          </span>
          <Button asChild>
            <Link to="/app/workouts?tab=session">{m.continueWorkout}</Link>
          </Button>
        </div>
      ) : planned.length === 0 ? (
        <span className="text-sm">{m.noWorkoutToday}</span>
      ) : (
        planned.map(({ plan, day }) => (
          <div key={day.id} className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex flex-col">
              <span className="font-semibold">{day.name}</span>
              <span className="text-sm text-text-muted">
                {m.workoutPlan(plan, day.exercises.length)}
              </span>
            </span>
            <Button type="button" disabled={start.isPending} onClick={() => void begin(day.id)}>
              {m.startWorkout}
            </Button>
          </div>
        ))
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
