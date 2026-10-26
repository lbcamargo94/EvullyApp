import { errorCode, useSessionMutation } from '@evully/app-core';
import type { WorkoutSessionDto } from '@evully/contracts';
import { Button, Card } from '@evully/ui';
import { Plus, Repeat, X } from 'lucide-react';
import { useState } from 'react';
import { ExercisePicker } from './exercise-picker';
import { formatPrescription, sessionErrorByCode, sessionMessages as m } from './messages.pt-BR';
import { RestTimer } from './rest-timer';
import { SetRow } from './set-row';

type Performance = WorkoutSessionDto['performances'][number];
const errorText = (e: unknown) => sessionErrorByCode[errorCode(e) ?? ''] ?? m.genericError;

/** One exercise of the session: target, last time, sets and rest timer. */
export function PerformanceCard({
  profileId,
  performance: p,
}: {
  profileId: string;
  performance: Performance;
}) {
  const addSet = useSessionMutation(profileId, (api, pid, _: undefined) => api.addSet(pid, p.id));
  const replace = useSessionMutation(profileId, (api, pid, exerciseId: string) =>
    api.replaceExercise(pid, p.id, exerciseId),
  );
  const remove = useSessionMutation(profileId, (api, pid, _: undefined) =>
    api.removeExercise(pid, p.id),
  );
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Card aria-label={p.exerciseName} className="gap-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-semibold uppercase">{p.exerciseName}</h3>
          <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-0.5 text-sm">
            {p.prescription && (
              <>
                <dt className="text-text-muted">{m.target}</dt>
                <dd className="tabular-nums">{formatPrescription(p.prescription)}</dd>
              </>
            )}
            <dt className="text-text-muted">{m.last}</dt>
            <dd className="tabular-nums">
              {p.last
                ? m.lastValue(p.last.weightKg, p.last.values, p.last.unit, p.last.date)
                : m.noLast}
            </dd>
          </dl>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 px-2"
          aria-label={m.swap}
          onClick={() => setSwapping(true)}
        >
          <Repeat aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 px-2"
          aria-label={m.removeExercise(p.exerciseName)}
          onClick={() => void run(() => remove.mutateAsync(undefined))}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {swapping && (
        <ExercisePicker
          profileId={profileId}
          onPick={(e) => void run(() => replace.mutateAsync(e.id)).then(() => setSwapping(false))}
          onCancel={() => setSwapping(false)}
        />
      )}
      <ul className="flex flex-col gap-1.5">
        {p.sets.map((set) => (
          <SetRow
            key={set.id}
            profileId={profileId}
            set={set}
            targetType={p.targetType}
            onError={setError}
          />
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => void run(() => addSet.mutateAsync(undefined))}
        >
          <Plus aria-hidden="true" className="size-4" />
          {m.addSet}
        </Button>
        <RestTimer
          seconds={p.prescription?.maxRestSeconds ?? p.prescription?.minRestSeconds ?? 90}
        />
      </div>
    </Card>
  );
}
