import { errorCode, parseDecimal, useSessionMutation } from '@evully/app-core';
import type { SetValuesDto, WorkoutSessionDto } from '@evully/contracts';
import { Input } from '@evully/ui';
import { X } from 'lucide-react';
import { useState } from 'react';
import { sessionErrorByCode, sessionMessages as m } from './messages.pt-BR';

type SetDto = WorkoutSessionDto['performances'][number]['sets'][number];
const kg = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, useGrouping: false });
const text = (n: number | null, decimal = false) =>
  n === null ? '' : decimal ? kg.format(n) : String(n);

/** Empty → null; otherwise a number, or undefined when it cannot be read. */
function read(raw: string, decimal: boolean): number | null | undefined {
  const value = raw.trim();
  if (!value) return null;
  if (decimal) return parseDecimal(value) ?? undefined;
  return /^\d+$/.test(value) ? Number(value) : undefined;
}

/** One set; each change is saved when leaving the field or ticking ✓ (README §10.4). */
export function SetRow({
  profileId,
  set,
  targetType,
  onError,
}: {
  profileId: string;
  set: SetDto;
  targetType: 'reps' | 'seconds';
  onError: (message: string | null) => void;
}) {
  const update = useSessionMutation(profileId, (api, pid, values: SetValuesDto) =>
    api.updateSet(pid, set.id, values),
  );
  const remove = useSessionMutation(profileId, (api, pid, _: undefined) =>
    api.removeSet(pid, set.id),
  );
  const reps = targetType === 'reps';
  const [load, setLoad] = useState(text(set.weightKg, true));
  const [amount, setAmount] = useState(text(reps ? set.repetitions : set.durationSeconds));
  const [rir, setRir] = useState(text(set.rir));

  const save = async (completed: boolean) => {
    const weightKg = read(load, true);
    const value = read(amount, false);
    const rirValue = read(rir, false);
    if (weightKg === undefined || value === undefined || rirValue === undefined) {
      return onError(m.invalidNumber);
    }
    try {
      await update.mutateAsync({
        weightKg,
        repetitions: reps ? value : null,
        durationSeconds: reps ? null : value,
        rir: rirValue,
        completed,
        notes: set.notes,
      });
      onError(null);
    } catch (e) {
      onError(sessionErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };
  const onBlur = () => void save(set.completed);

  const field = (label: string, value: string, setValue: (v: string) => void, width: string) => (
    <Input
      inputMode="decimal"
      aria-label={`${m.set(set.setNumber)}: ${label}`}
      placeholder={label}
      className={`min-h-11 text-center text-lg tabular-nums ${width}`}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
    />
  );

  return (
    <li
      className={
        set.completed
          ? 'flex flex-wrap items-center gap-2 rounded-md bg-brand-soft px-2 py-1.5'
          : 'flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5'
      }
    >
      <span className="w-16 text-sm font-semibold">{m.set(set.setNumber)}</span>
      {field(m.load, load, setLoad, 'w-24')}
      {field(reps ? m.reps : m.seconds, amount, setAmount, 'w-20')}
      {field(m.rir, rir, setRir, 'w-16')}
      <input
        type="checkbox"
        className="size-7 accent-brand"
        aria-label={m.doneLabel(set.setNumber)}
        checked={set.completed}
        disabled={update.isPending}
        onChange={(e) => void save(e.target.checked)}
      />
      <button
        type="button"
        aria-label={m.removeSet(set.setNumber)}
        disabled={remove.isPending}
        onClick={() =>
          void remove
            .mutateAsync(undefined)
            .catch((e: unknown) =>
              onError(sessionErrorByCode[errorCode(e) ?? ''] ?? m.genericError),
            )
        }
        className="ml-auto rounded-sm p-1.5 text-text-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}
