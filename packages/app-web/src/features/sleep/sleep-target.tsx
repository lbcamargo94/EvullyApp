import { errorCode, useSetSleepTarget } from '@evully/app-core';
import type { SleepTargetDto } from '@evully/contracts';
import { Button, Field, Input } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { sleepErrorByCode, sleepMessages as m } from './messages.pt-BR';

/** Empty means 0; anything else must be a whole number. */
function parseWhole(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;
}

/**
 * Nightly target typed by the user (README §13.1); a change applies from today
 * on. Both fields empty clears it.
 */
export function SleepTargetForm({
  profileId,
  target,
  onDone,
}: {
  profileId: string;
  target: SleepTargetDto | null;
  onDone: () => void;
}) {
  const save = useSetSleepTarget(profileId);
  const current = target?.minutesPerNight ?? null;
  const [hours, setHours] = useState(() =>
    current === null ? '' : String(Math.floor(current / 60)),
  );
  const [minutes, setMinutes] = useState(() => (current === null ? '' : String(current % 60)));
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const h = parseWhole(hours);
    const min = parseWhole(minutes);
    if (h === undefined || min === undefined || min > 59) return setError(m.targetInvalid);
    const total = h * 60 + min;
    try {
      await save.mutateAsync({ minutesPerNight: hours.trim() || minutes.trim() ? total : null });
      onDone();
    } catch (err) {
      setError(sleepErrorByCode[errorCode(err) ?? ''] ?? m.genericError);
    }
  };

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">{m.targetHint}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field id="sleep-target-hours" label={m.targetHours}>
          <Input
            id="sleep-target-hours"
            inputMode="numeric"
            autoComplete="off"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
        <Field id="sleep-target-minutes" label={m.targetMinutes}>
          <Input
            id="sleep-target-minutes"
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
