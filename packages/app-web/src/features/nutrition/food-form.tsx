import { errorCode, parseDecimal, useCreateFood, useUpdateFood } from '@evully/app-core';
import type { FoodDto, FoodInput, FoodUnit } from '@evully/contracts';
import { Button, Card, Field, Input, NativeSelect } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { foodErrorByCode, foodMessages as m, unitLabels } from './messages.pt-BR';

const NUTRIENTS = [
  ['caloriesKcal', m.calories, true],
  ['proteinG', m.protein, true],
  ['carbohydrateG', m.carbohydrate, true],
  ['fatG', m.fat, true],
  ['fiberG', m.fiber, false],
  ['sodiumMg', m.sodium, false],
] as const;
type NutrientKey = (typeof NUTRIENTS)[number][0];

type Values = Record<'name' | 'brand' | 'source' | 'referenceAmount' | NutrientKey, string> & {
  referenceUnit: FoodUnit;
};

// No thousands separator, so "1600" or "2,5" can be edited back as typed.
const plain = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, useGrouping: false });
const text = (value: number | null | undefined) => (value == null ? '' : plain.format(value));

function initialValues(food: FoodDto | null): Values {
  const values: Values = {
    name: food?.name ?? '',
    brand: food?.brand ?? '',
    source: food?.source ?? '',
    referenceAmount: food ? text(food.referenceAmount) : '100',
    referenceUnit: food?.referenceUnit ?? 'g',
    caloriesKcal: '',
    proteinG: '',
    carbohydrateG: '',
    fatG: '',
    fiberG: '',
    sodiumMg: '',
  };
  for (const [key] of NUTRIENTS) values[key] = text(food?.[key]);
  return values;
}

/** Empty → null; otherwise the number, or undefined when it cannot be read. */
const readNumber = (raw: string) => (raw.trim() ? (parseDecimal(raw) ?? undefined) : null);

/** Reads the nutrient fields; returns the label of the first invalid one instead. */
function readNutrients(values: Values): Record<NutrientKey, number | null> | string {
  const numbers = {} as Record<NutrientKey, number | null>;
  for (const [key, label, required] of NUTRIENTS) {
    const parsed = readNumber(values[key]);
    if (parsed === undefined || (required && parsed === null)) return label;
    numbers[key] = parsed;
  }
  return numbers;
}

/** Parses the typed numbers; returns the label of the first invalid field instead. */
function toInput(values: Values): FoodInput | string {
  const amount = parseDecimal(values.referenceAmount);
  if (amount === null) return m.amount;
  const n = readNutrients(values);
  if (typeof n === 'string') return n;
  return {
    name: values.name,
    brand: values.brand.trim() || null,
    referenceAmount: amount,
    referenceUnit: values.referenceUnit,
    // Required fields were checked above, so these are numbers.
    caloriesKcal: n.caloriesKcal ?? 0,
    proteinG: n.proteinG ?? 0,
    carbohydrateG: n.carbohydrateG ?? 0,
    fatG: n.fatG ?? 0,
    fiberG: n.fiberG,
    sodiumMg: n.sodiumMg,
    source: values.source.trim() || null,
  };
}

/** Creates a food, or edits `editing` (README §9.2). Values come from the user, never the app. */
export function FoodForm({ editing, onDone }: { editing: FoodDto | null; onDone: () => void }) {
  const create = useCreateFood();
  const update = useUpdateFood();
  const [values, setValues] = useState(() => initialValues(editing));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const busy = create.isPending || update.isPending;
  const set = (patch: Partial<Values>) => setValues((v) => ({ ...v, ...patch }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    const input = toInput(values);
    if (typeof input === 'string') return setError(m.invalidNumber(input));
    try {
      const saved = editing
        ? await update.mutateAsync({ ...input, id: editing.id })
        : await create.mutateAsync(input);
      setError(null);
      setValues(initialValues(null));
      setStatus(m.saved(saved.name));
      onDone();
    } catch (e) {
      setError(foodErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };

  return (
    <Card aria-label={editing ? m.editTitle : m.formTitle} className="flex-[1_1_340px]">
      <h2 className="text-lg font-semibold">{editing ? m.editTitle : m.formTitle}</h2>
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        <Field id="food-name" label={m.name}>
          <Input
            id="food-name"
            maxLength={80}
            placeholder={m.namePlaceholder}
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field id="food-brand" label={m.brand} hint={m.optional}>
          <Input
            id="food-brand"
            maxLength={60}
            value={values.brand}
            onChange={(e) => set({ brand: e.target.value })}
          />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{m.per}</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field id="food-amount" label={m.amount}>
              <Input
                id="food-amount"
                inputMode="decimal"
                value={values.referenceAmount}
                onChange={(e) => set({ referenceAmount: e.target.value })}
              />
            </Field>
            <Field id="food-unit" label={m.unit}>
              <NativeSelect
                id="food-unit"
                value={values.referenceUnit}
                onChange={(e) => set({ referenceUnit: e.target.value as FoodUnit })}
              >
                {(Object.keys(unitLabels) as FoodUnit[]).map((unit) => (
                  <option key={unit} value={unit}>
                    {unitLabels[unit]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          {NUTRIENTS.map(([key, label, required]) => (
            <Field
              key={key}
              id={`food-${key}`}
              label={label}
              hint={required ? undefined : m.optional}
            >
              <Input
                id={`food-${key}`}
                inputMode="decimal"
                autoComplete="off"
                value={values[key]}
                onChange={(e) => set({ [key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
        <Field id="food-source" label={m.source} hint={m.optional}>
          <Input
            id="food-source"
            maxLength={120}
            placeholder={m.sourcePlaceholder}
            value={values.source}
            onChange={(e) => set({ source: e.target.value })}
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
              {m.cancel}
            </Button>
          )}
        </div>
        {status && (
          <p role="status" className="text-sm text-text-muted">
            {status}
          </p>
        )}
      </form>
    </Card>
  );
}
