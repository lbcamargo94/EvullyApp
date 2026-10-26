import { errorCode, useSessionMutation } from '@evully/app-core';
import type { WorkoutSessionDto } from '@evully/contracts';
import { Button, Card, ConfirmDialog, Input } from '@evully/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ExercisePicker } from './exercise-picker';
import { sessionErrorByCode, sessionMessages as m } from './messages.pt-BR';
import { PerformanceCard } from './performance-card';

const errorText = (e: unknown) => sessionErrorByCode[errorCode(e) ?? ''] ?? m.genericError;

/** The open session, built for quick use at the gym (README §10.4). */
export function SessionView({
  profileId,
  session,
}: {
  profileId: string;
  session: WorkoutSessionDto;
}) {
  const add = useSessionMutation(profileId, (api, pid, exerciseId: string) =>
    api.addExercise(pid, session.id, exerciseId),
  );
  const finish = useSessionMutation(profileId, (api, pid, notes: string | null) =>
    api.finish(pid, session.id, notes),
  );
  const discard = useSessionMutation(profileId, (api, pid, _: undefined) =>
    api.discard(pid, session.id),
  );
  const [picking, setPicking] = useState(false);
  const [notes, setNotes] = useState(session.notes ?? '');
  const [confirming, setConfirming] = useState(false);
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
    <div className="flex max-w-4xl flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-semibold">
          {session.dayName ? `${session.dayName}` : m.freeSession}
        </h2>
        <span className="text-sm text-text-muted">
          {session.planName && `${session.planName} · `}
          {m.startedAt(session.startedAt)}
        </span>
      </div>
      {session.performances.map((p) => (
        <PerformanceCard key={p.id} profileId={profileId} performance={p} />
      ))}
      {picking ? (
        <Card>
          <ExercisePicker
            profileId={profileId}
            onPick={(e) => void run(() => add.mutateAsync(e.id)).then(() => setPicking(false))}
            onCancel={() => setPicking(false)}
          />
        </Card>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          onClick={() => setPicking(true)}
        >
          <Plus aria-hidden="true" className="size-4" />
          {m.addExercise}
        </Button>
      )}
      <Card className="gap-3">
        <Input
          aria-label={m.notes}
          placeholder={m.notes}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={finish.isPending}
            onClick={() => void run(() => finish.mutateAsync(notes.trim() || null))}
          >
            {finish.isPending ? m.finishing : m.finish}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
            {m.discard}
          </Button>
        </div>
      </Card>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={m.discardTitle}
        description={m.discardBody}
        confirmLabel={m.discard}
        cancelLabel={m.cancel}
        destructive
        busy={discard.isPending}
        onConfirm={() =>
          void run(() => discard.mutateAsync(undefined)).then(() => setConfirming(false))
        }
      />
    </div>
  );
}
