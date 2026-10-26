import { errorCode, useSetCardioTarget } from '@evully/app-core';
import type { CardioOverview, CardioTargetDto } from '@evully/contracts';
import { Button, Field, Input, ProgressBar } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { cardioErrorByCode, cardioMessages as m } from './messages.pt-BR';

type Week = CardioOverview['thisWeek'];

/** Sessions and minutes of the week against the target in force (README §11.1). */
export function CardioTargetProgress({ week, target }: { week: Week; target: CardioTargetDto }) {
  const rows: [string, number, number | null][] = [
    [m.targetSessions, week.sessions, target.sessionsPerWeek],
    [m.targetMinutes, week.minutes, target.minutesPerWeek],
  ];
  return (
    <dl className="flex flex-col gap-2">
      {rows.map(([label, value, goal]) =>
        goal === null ? null : (
          <div key={label} className="flex flex-col gap-1">
            <div className="flex justify-between gap-3 text-sm">
              <dt className="text-text-muted">{label}</dt>
              <dd className="font-semibold tabular-nums">{m.ofTarget(value, goal)}</dd>
            </div>
            <ProgressBar value={value} max={goal} label={label} />
          </div>
        ),
      )}
    </dl>
  );
}

const text = (value: number | null | undefined) => (value == null ? '' : String(value));

/** Empty means not set; anything else must be a whole number. */
function parseWhole(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;
}

/** Weekly target typed by the user; a change applies from today on. */
export function CardioTargetForm({
  profileId,
  target,
  onDone,
}: {
  profileId: string;
  target: CardioTargetDto | null;
  onDone: () => void;
}) {
  const save = useSetCardioTarget(profileId);
  const [sessions, setSessions] = useState(() => text(target?.sessionsPerWeek));
  const [minutes, setMinutes] = useState(() => text(target?.minutesPerWeek));
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const sessionsPerWeek = parseWhole(sessions);
    const minutesPerWeek = parseWhole(minutes);
    if (sessionsPerWeek === undefined || minutesPerWeek === undefined) {
      return setError(m.targetInvalid);
    }
    try {
      await save.mutateAsync({ sessionsPerWeek, minutesPerWeek });
      onDone();
    } catch (err) {
      setError(cardioErrorByCode[errorCode(err) ?? ''] ?? m.genericError);
    }
  };

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">{m.targetHint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="cardio-target-sessions" label={m.targetSessions} hint={m.optional}>
          <Input
            id="cardio-target-sessions"
            inputMode="numeric"
            autoComplete="off"
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
          />
        </Field>
        <Field id="cardio-target-minutes" label={m.targetMinutes} hint={m.optional}>
          <Input
            id="cardio-target-minutes"
            inputMode="numeric"
            autoComplete="off"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? m.saving : m.targetSave}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {m.cancel}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
