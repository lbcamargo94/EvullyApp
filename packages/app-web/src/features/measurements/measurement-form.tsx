import {
  errorCode,
  localDateTimeToIso,
  localNowTime,
  localToday,
  parseDecimal,
  useRegisterMeasurement,
  useUpdateMeasurement,
} from '@evully/app-core';
import type { MeasurementSession, MeasurementTypeDto } from '@evully/contracts';
import { Button, Card, Field, Input } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { measurementErrorByCode, measurementMessages as m } from './messages.pt-BR';

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function initialValues(types: MeasurementTypeDto[], editing: MeasurementSession | null) {
  const byType = new Map(editing?.values.map((v) => [v.measurementTypeId, v.valueCm]));
  return {
    date: (editing?.measuredOn ?? localToday()) as string,
    notes: editing?.notes ?? '',
    values: Object.fromEntries(
      types.map((t) => {
        const value = byType.get(t.id);
        return [t.id, value === undefined ? '' : decimal.format(value)];
      }),
    ) as Record<string, string>,
  };
}

/** Keeps the original time when an edit keeps the date; otherwise uses the current time. */
function sessionInstant(date: string, editing: MeasurementSession | null): string {
  if (editing && editing.measuredOn === date) return editing.measuredAt;
  return localDateTimeToIso(date, localNowTime());
}

/** One input per tracked measurement, with the "how to measure" tip (README §8.4). */
export function MeasurementForm({
  profileId,
  types,
  editing,
  onDone,
}: {
  profileId: string;
  types: MeasurementTypeDto[];
  editing: MeasurementSession | null;
  onDone: () => void;
}) {
  const register = useRegisterMeasurement(profileId);
  const update = useUpdateMeasurement(profileId);
  const [form, setForm] = useState(() => initialValues(types, editing));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const busy = register.isPending || update.isPending;

  const parseValues = () => {
    const values: { measurementTypeId: string; valueCm: number }[] = [];
    for (const type of types) {
      const text = form.values[type.id]?.trim() ?? '';
      if (!text) continue;
      const valueCm = parseDecimal(text);
      if (valueCm === null) return m.invalidValue(type.name);
      values.push({ measurementTypeId: type.id, valueCm });
    }
    return values;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    const values = parseValues();
    if (typeof values === 'string') return setError(values);
    const input = {
      profileId,
      measuredOn: form.date,
      measuredAt: sessionInstant(form.date, editing),
      values,
      notes: form.notes.trim() || null,
    };
    try {
      if (editing) await update.mutateAsync({ ...input, id: editing.id });
      else await register.mutateAsync(input);
      setError(null);
      setForm(initialValues(types, null));
      setStatus(editing ? null : m.saved);
      onDone();
    } catch (e) {
      setError(measurementErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };

  return (
    <Card aria-label={editing ? m.editTitle : m.formTitle} className="flex-[1_1_360px]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{editing ? m.editTitle : m.formTitle}</h2>
        <p className="text-sm text-text-muted">{m.formHint}</p>
      </div>
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        <Field id="measurement-date" label={m.date}>
          <Input
            id="measurement-date"
            type="date"
            max={localToday()}
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </Field>
        <div className="flex flex-col divide-y divide-border">
          {types.map((type) => (
            <label
              key={type.id}
              htmlFor={`m-${type.id}`}
              className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 py-2.5"
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{type.name}</span>
                <span className="text-[13px] text-text-muted">{type.instructions}</span>
              </span>
              <Input
                id={`m-${type.id}`}
                inputMode="decimal"
                autoComplete="off"
                placeholder={m.cm}
                value={form.values[type.id] ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, values: { ...f.values, [type.id]: e.target.value } }))
                }
                className="text-right tabular-nums"
              />
            </label>
          ))}
        </div>
        <Field id="measurement-notes" label={m.notes} hint={m.optional}>
          <Input
            id="measurement-notes"
            maxLength={280}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy} className="flex-1">
            {busy ? m.saving : editing ? m.saveEdit : m.save}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={onDone}>
              {m.cancelEdit}
            </Button>
          )}
        </div>
        <p role="status" className="text-sm text-text-muted">
          {status ?? m.onlyTracked}
        </p>
      </form>
    </Card>
  );
}
