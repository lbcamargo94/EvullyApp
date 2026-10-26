import {
  errorCode,
  isoWeekday,
  localToday,
  useOpenSession,
  useSessionMutation,
  useWorkoutPlans,
} from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { useState } from 'react';
import { sessionErrorByCode, sessionMessages as m, weekdayLabels } from './messages.pt-BR';
import { SessionView } from './session-view';

/** Treinos › Treinar: start a session or continue the open one (README §10.4). */
export function SessionTab({ profileId }: { profileId: string }) {
  const { data: session, isPending } = useOpenSession(profileId);
  if (isPending) return null;
  return session ? (
    <SessionView profileId={profileId} session={session} />
  ) : (
    <StartSession profileId={profileId} />
  );
}

function StartSession({ profileId }: { profileId: string }) {
  const { data: plans = [] } = useWorkoutPlans(profileId);
  const start = useSessionMutation(profileId, (api, pid, dayId: string | null) =>
    api.start(pid, dayId),
  );
  const [error, setError] = useState<string | null>(null);
  const weekday = isoWeekday(localToday());
  const active = plans.filter((p) => p.status === 'active');

  const begin = async (dayId: string | null) => {
    try {
      await start.mutateAsync(dayId);
    } catch (e) {
      setError(sessionErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };

  return (
    <Card aria-labelledby="start-title" className="max-w-3xl gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="start-title" className="text-lg font-semibold">
          {m.startTitle}
        </h2>
        <p className="text-sm text-text-muted">{active.length ? m.startHint : m.noPlans}</p>
      </div>
      {active.map((plan) => (
        <section key={plan.id} aria-label={plan.name} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-muted uppercase">{plan.name}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.days.map((day) => {
              const isToday = day.weekday === weekday;
              return (
                <button
                  key={day.id}
                  type="button"
                  disabled={start.isPending}
                  onClick={() => void begin(day.id)}
                  className={
                    isToday
                      ? 'flex flex-col items-start gap-0.5 rounded-md border-2 border-brand bg-brand-soft p-3 text-left focus-visible:outline-2 focus-visible:outline-brand'
                      : 'flex flex-col items-start gap-0.5 rounded-md border border-border bg-surface p-3 text-left hover:border-brand/60 focus-visible:outline-2 focus-visible:outline-brand'
                  }
                >
                  <span className="font-semibold">{day.name}</span>
                  <span className="text-sm text-text-muted">
                    {day.weekday !== null && weekdayLabels[day.weekday - 1]}
                    {isToday && ` · ${m.today}`}
                    {` · ${day.exercises.length} ex.`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="self-start"
        disabled={start.isPending}
        onClick={() => void begin(null)}
      >
        {m.free}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
