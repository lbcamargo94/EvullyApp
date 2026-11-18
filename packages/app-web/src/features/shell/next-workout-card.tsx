import {
  errorCode,
  isoWeekday,
  localDateOf,
  localToday,
  useOpenSession,
  useSessionMutation,
  useWorkoutPlans,
  useWorkoutStats,
} from '@evully/app-core';
import type { WorkoutPlanDto, WorkoutSessionDto } from '@evully/contracts';
import { Button, Card } from '@evully/ui';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { sessionErrorByCode } from '../workouts/messages.pt-BR';
import { shellMessages as m } from './messages.pt-BR';

interface TodayWorkout {
  session: WorkoutSessionDto | null;
  planned: { plan: string; day: WorkoutPlanDto['days'][number] }[];
  /** Plan days (or null, a free workout) of the sessions finished today. */
  finished: (string | null)[];
}

/**
 * The open session, today's days of the active plans and the workouts already
 * finished today; null when there is nothing to show.
 */
function useTodayWorkout(profileId: string, today: string): TodayWorkout | null {
  const { data: plans = [] } = useWorkoutPlans(profileId);
  const { data: session = null } = useOpenSession(profileId);
  const { data: stats = [] } = useWorkoutStats(profileId);
  const finished = stats.filter((s) => localDateOf(s.startedAt) === today).map((s) => s.dayId);
  const active = plans.filter((p) => p.status === 'active');
  const scheduled = active.some((p) => p.days.some((d) => d.weekday !== null));
  if (!session && !scheduled && finished.length === 0) return null;
  const weekday = isoWeekday(today);
  const planned = active.flatMap((p) =>
    p.days.filter((d) => d.weekday === weekday).map((day) => ({ plan: p.name, day })),
  );
  return { session, planned, finished };
}

/**
 * "Próximo treino" on the dashboard (README §13.1): the open session or today's
 * planned days; hidden for profiles without scheduled plans or workouts today.
 */
export function NextWorkoutCard({ profileId }: { profileId: string }) {
  const workout = useTodayWorkout(profileId, localToday());
  if (!workout) return null;
  return <WorkoutContent profileId={profileId} workout={workout} />;
}

function WorkoutContent({ profileId, workout }: { profileId: string; workout: TodayWorkout }) {
  const start = useSessionMutation(profileId, (api, pid, dayId: string) => api.start(pid, dayId));
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { session, planned, finished } = workout;

  const begin = async (dayId: string) => {
    try {
      await start.mutateAsync(dayId);
      void navigate('/app/workouts?tab=session');
    } catch (e) {
      setError(sessionErrorByCode[errorCode(e) ?? ''] ?? m.workoutError);
    }
  };

  return (
    <Card aria-labelledby="next-workout-title" className="gap-3">
      <h2 id="next-workout-title" className="text-heading font-semibold">
        {m.workoutTitle}
      </h2>
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
        <span className="text-sm">
          {finished.length > 0 ? m.workoutDoneToday : m.noWorkoutToday}
        </span>
      ) : (
        planned.map(({ plan, day }) => (
          <div key={day.id} className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex flex-col">
              <span className="font-semibold">{day.name}</span>
              <span className="text-sm text-text-muted">
                {m.workoutPlan(plan, day.exercises.length)}
              </span>
            </span>
            {finished.includes(day.id) ? (
              <span className="flex items-center gap-1 text-sm font-semibold">
                <Check aria-hidden="true" className="size-4 text-brand" />
                {m.workoutDone}
              </span>
            ) : (
              <Button type="button" disabled={start.isPending} onClick={() => void begin(day.id)}>
                {m.startWorkout}
              </Button>
            )}
          </div>
        ))
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
