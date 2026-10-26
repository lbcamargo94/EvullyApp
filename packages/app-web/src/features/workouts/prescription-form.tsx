import type { PrescriptionDto } from '@evully/contracts';
import { Button, Input, NativeSelect } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { prescriptionMessages as m } from './messages.pt-BR';

export const DEFAULT_PRESCRIPTION: PrescriptionDto = {
  sets: 3,
  targetType: 'reps',
  minReps: 8,
  maxReps: 12,
  minSeconds: null,
  maxSeconds: null,
  perSide: false,
  minRir: null,
  maxRir: null,
  minRestSeconds: null,
  maxRestSeconds: null,
  notes: null,
};

const FIELDS = [
  'sets',
  'minReps',
  'maxReps',
  'minSeconds',
  'maxSeconds',
  'minRir',
  'maxRir',
  'minRestSeconds',
  'maxRestSeconds',
] as const;
type NumberField = (typeof FIELDS)[number];
type Values = Record<NumberField, string> &
  Pick<PrescriptionDto, 'targetType' | 'perSide'> & {
    notes: string;
  };

function toValues(p: PrescriptionDto): Values {
  const values = { targetType: p.targetType, perSide: p.perSide, notes: p.notes ?? '' } as Values;
  for (const f of FIELDS) values[f] = p[f] === null ? '' : String(p[f]);
  return values;
}

/** Whole numbers only; empty = not set. Returns null when something is not a number. */
function toPrescription(v: Values): PrescriptionDto | null {
  const out = {
    targetType: v.targetType,
    perSide: v.perSide,
    notes: v.notes.trim() || null,
  } as PrescriptionDto;
  for (const f of FIELDS) {
    const raw = v[f].trim();
    if (raw && !/^\d+$/.test(raw)) return null;
    (out as Record<NumberField, number | null>)[f] = raw ? Number(raw) : null;
  }
  return out.sets === null ? null : out;
}

/** Inline editor of a prescription (README §10.3); the server validates the ranges. */
export function PrescriptionForm({
  initial,
  submitLabel,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial: PrescriptionDto;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  onSubmit: (prescription: PrescriptionDto) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(() => toValues(initial));
  const [local, setLocal] = useState<string | null>(null);
  const set = (patch: Partial<Values>) => setV((current) => ({ ...current, ...patch }));
  const reps = v.targetType === 'reps';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const prescription = toPrescription(v);
    if (!prescription) return setLocal(m.invalid);
    setLocal(null);
    onSubmit(prescription);
  };

  const num = (field: NumberField, label: string) => (
    <Input
      inputMode="numeric"
      aria-label={label}
      className="min-h-9 w-16 text-center tabular-nums"
      value={v[field]}
      onChange={(e) => set({ [field]: e.target.value })}
    />
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-md bg-surface-muted p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          {m.sets} {num('sets', m.sets)}
        </label>
        <NativeSelect
          aria-label={m.target}
          className="min-h-9 w-36"
          value={v.targetType}
          onChange={(e) => set({ targetType: e.target.value as Values['targetType'] })}
        >
          <option value="reps">{m.reps}</option>
          <option value="seconds">{m.seconds}</option>
        </NativeSelect>
        <span className="flex items-center gap-1">
          {num(reps ? 'minReps' : 'minSeconds', `${m.min} ${reps ? m.reps : m.seconds}`)}–
          {num(reps ? 'maxReps' : 'maxSeconds', `${m.max} ${reps ? m.reps : m.seconds}`)}
        </span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-brand"
            checked={v.perSide}
            onChange={(e) => set({ perSide: e.target.checked })}
          />
          {m.perSide}
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="flex items-center gap-1">
          {m.rir} {num('minRir', `${m.min} ${m.rir}`)}–{num('maxRir', `${m.max} ${m.rir}`)}
        </span>
        <span className="flex items-center gap-1">
          {m.rest} {num('minRestSeconds', `${m.min} ${m.rest}`)}–
          {num('maxRestSeconds', `${m.max} ${m.rest}`)}
        </span>
        <Input
          aria-label={m.notes}
          placeholder={`${m.notes} (${m.optional})`}
          maxLength={200}
          className="min-h-9 max-w-64 flex-1"
          value={v.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </div>
      {(local ?? error) && (
        <p role="alert" className="text-sm text-danger">
          {local ?? error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="min-h-9" disabled={busy}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" className="min-h-9" onClick={onCancel}>
          {m.cancel}
        </Button>
      </div>
    </form>
  );
}
