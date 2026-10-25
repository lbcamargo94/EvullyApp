import {
  errorCode,
  formatLocalDate,
  parseDecimal,
  useNutritionTarget,
  useSetNutritionTarget,
} from '@evully/app-core';
import type { NutritionTargetDto } from '@evully/contracts';
import { Button, Card, Field, Input } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { targetMessages as m } from '../nutrition/messages.pt-BR';

const FIELDS = [
  ['caloriesKcal', m.calories, true],
  ['proteinG', m.protein, true],
  ['carbohydrateG', m.carbohydrate, false],
  ['fatG', m.fat, false],
  ['waterMl', m.water, false],
] as const;
type Key = (typeof FIELDS)[number][0];
type Values = Record<Key, string>;

const text = (value: number | null | undefined) => (value == null ? '' : String(value));

function initialValues(target: NutritionTargetDto | null): Values {
  const values = {} as Values;
  for (const [key] of FIELDS) values[key] = text(target?.[key]);
  return values;
}

/** Parses the fields; returns the label of the first invalid one instead. */
function parse(values: Values): Record<Key, number | null> | string {
  const result = {} as Record<Key, number | null>;
  for (const [key, label, required] of FIELDS) {
    const raw = values[key].trim();
    const value = raw ? parseDecimal(raw) : null;
    if ((raw && value === null) || (required && value === null)) return label;
    result[key] = value;
  }
  return result;
}

/** Settings › Nutrição: daily targets typed by the user (README §9.6). */
export function NutritionTargetsSection({ profileId }: { profileId: string }) {
  const { data: target, isPending } = useNutritionTarget(profileId);
  if (isPending) return null;
  return <TargetsForm key={target?.id ?? 'none'} profileId={profileId} target={target ?? null} />;
}

function TargetsForm({
  profileId,
  target,
}: {
  profileId: string;
  target: NutritionTargetDto | null;
}) {
  const save = useSetNutritionTarget(profileId);
  const [values, setValues] = useState(() => initialValues(target));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = parse(values);
    if (typeof parsed === 'string') return setMessage({ ok: false, text: m.invalid(parsed) });
    try {
      await save.mutateAsync({
        ...parsed,
        caloriesKcal: parsed.caloriesKcal ?? 0,
        proteinG: parsed.proteinG ?? 0,
      });
      setMessage({ ok: true, text: m.saved });
    } catch (err) {
      const outOfRange = errorCode(err) === 'nutrition_target.out_of_range';
      setMessage({ ok: false, text: outOfRange ? m.outOfRange : m.genericError });
    }
  };

  return (
    <Card aria-labelledby="targets-title">
      <div className="flex flex-col gap-1">
        <h2 id="targets-title" className="text-lg font-semibold">
          {m.title}
        </h2>
        <p className="text-sm text-text-muted">{m.hint}</p>
        <p className="text-sm text-text-muted">
          {target ? m.since(formatLocalDate(target.effectiveFrom)) : m.none}
        </p>
      </div>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {FIELDS.map(([key, label, required]) => (
            <Field
              key={key}
              id={`target-${key}`}
              label={label}
              hint={required ? undefined : m.optional}
            >
              <Input
                id={`target-${key}`}
                inputMode="decimal"
                autoComplete="off"
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? m.saving : m.save}
          </Button>
          {message && (
            <p
              role={message.ok ? 'status' : 'alert'}
              className={message.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
