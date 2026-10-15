import {
  errorCode,
  isoToLocalTime,
  localDateTimeToIso,
  localNowTime,
  localToday,
  parseDecimal,
  useRegisterWeight,
  useTags,
  useUpdateWeight,
} from '@evully/app-core';
import type { WeightEntry } from '@evully/contracts';
import { Button, Card, Field, Input } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { weightErrorByCode, weightMessages as m } from './messages.pt-BR';
import { NewTagButton } from './new-tag-button';

const decimalFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

function initialValues(entry: WeightEntry | null) {
  return entry
    ? {
        weight: decimalFormat.format(entry.weightKg),
        date: entry.measuredOn as string,
        time: isoToLocalTime(entry.measuredAt),
        tagIds: entry.tags.map((t) => t.id),
        notes: entry.notes ?? '',
      }
    : { weight: '', date: localToday() as string, time: localNowTime(), tagIds: [], notes: '' };
}

/** Registers a weighing, or edits `editing` when given (README §8.4). */
export function WeightForm({
  profileId,
  editing,
  onDone,
}: {
  profileId: string;
  editing: WeightEntry | null;
  onDone: () => void;
}) {
  const { data: tags = [] } = useTags(profileId);
  const register = useRegisterWeight(profileId);
  const update = useUpdateWeight(profileId);
  const [values, setValues] = useState(() => initialValues(editing));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const busy = register.isPending || update.isPending;

  const toggleTag = (id: string) =>
    setValues((v) => ({
      ...v,
      tagIds: v.tagIds.includes(id) ? v.tagIds.filter((t) => t !== id) : [...v.tagIds, id],
    }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    const weightKg = parseDecimal(values.weight);
    if (weightKg === null) return setError(m.invalidWeight);
    const input = {
      profileId,
      measuredOn: values.date,
      measuredAt: localDateTimeToIso(values.date, values.time || '12:00'),
      weightKg,
      tagIds: values.tagIds,
      notes: values.notes.trim() || null,
    };
    try {
      if (editing) await update.mutateAsync({ ...input, id: editing.id });
      else await register.mutateAsync(input);
      setError(null);
      setValues(initialValues(null));
      setStatus(editing ? null : m.saved);
      onDone();
    } catch (e) {
      setError(weightErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };

  return (
    <Card aria-label={editing ? m.editTitle : m.formTitle} className="flex-[1_1_320px]">
      <h2 className="text-lg font-semibold">{editing ? m.editTitle : m.formTitle}</h2>
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        <Field id="weight" label={m.weight} error={error ?? undefined}>
          <Input
            id="weight"
            inputMode="decimal"
            autoComplete="off"
            placeholder="89,8"
            value={values.weight}
            aria-invalid={!!error}
            aria-describedby={error ? 'weight-error' : undefined}
            onChange={(e) => setValues((v) => ({ ...v, weight: e.target.value }))}
            className="min-h-14 text-2xl font-semibold tabular-nums"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="weight-date" label={m.date}>
            <Input
              id="weight-date"
              type="date"
              max={localToday()}
              value={values.date}
              onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
            />
          </Field>
          <Field id="weight-time" label={m.time}>
            <Input
              id="weight-time"
              type="time"
              value={values.time}
              onChange={(e) => setValues((v) => ({ ...v, time: e.target.value }))}
            />
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">
            {m.tags} <span className="font-normal text-text-muted">{m.optional}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const on = values.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag.id)}
                  className={
                    on
                      ? 'min-h-9 rounded-full border-2 border-brand bg-brand-soft px-3.5 text-sm font-semibold text-brand-soft-foreground'
                      : 'min-h-9 rounded-full border border-border bg-surface px-3.5 text-sm hover:border-brand/60'
                  }
                >
                  {tag.name}
                </button>
              );
            })}
            <NewTagButton
              profileId={profileId}
              onCreated={(tag) => setValues((v) => ({ ...v, tagIds: [...v.tagIds, tag.id] }))}
            />
          </div>
        </fieldset>
        <Field id="weight-notes" label={m.notes} hint={m.optional}>
          <Input
            id="weight-notes"
            maxLength={280}
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          />
        </Field>
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
          {status ?? m.latestOfDay}
        </p>
      </form>
    </Card>
  );
}
