import { errorCode, parseDecimal, useCreateExercise, useUpdateExercise } from '@evully/app-core';
import type { ExerciseDto, MuscleGroup } from '@evully/contracts';
import { Button, Card, Field, Input, NativeSelect } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { exerciseErrorByCode, exerciseMessages as m, muscleGroupLabels } from './messages.pt-BR';

const GROUPS = Object.keys(muscleGroupLabels) as MuscleGroup[];
const textarea =
  'min-h-20 w-full rounded-sm border border-border bg-surface px-3 py-2 text-[15px] text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand';

const EMPTY = {
  name: '',
  muscleGroup: 'chest' as MuscleGroup,
  secondaryMuscles: [] as MuscleGroup[],
  equipment: '',
  loadIncrement: '',
  instructions: '',
  notes: '',
};

function initialValues(e: ExerciseDto | null): typeof EMPTY {
  if (!e) return EMPTY;
  return {
    name: e.name,
    muscleGroup: e.muscleGroup,
    secondaryMuscles: e.secondaryMuscles,
    equipment: e.equipment ?? '',
    loadIncrement: e.loadIncrementKg === null ? '' : String(e.loadIncrementKg).replace('.', ','),
    instructions: e.instructions ?? '',
    notes: e.notes ?? '',
  };
}
type Values = ReturnType<typeof initialValues>;

const orNull = (text: string) => text.trim() || null;

/** Creates or edits one of the profile's own exercises (README §10.1). */
export function ExerciseForm({
  profileId,
  editing,
  onDone,
}: {
  profileId: string;
  editing: ExerciseDto | null;
  onDone: () => void;
}) {
  const create = useCreateExercise(profileId);
  const update = useUpdateExercise(profileId);
  const [values, setValues] = useState(() => initialValues(editing));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const busy = create.isPending || update.isPending;
  const set = (patch: Partial<Values>) => setValues((v) => ({ ...v, ...patch }));

  const toggleSecondary = (g: MuscleGroup) =>
    set({
      secondaryMuscles: values.secondaryMuscles.includes(g)
        ? values.secondaryMuscles.filter((x) => x !== g)
        : [...values.secondaryMuscles, g],
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const increment = values.loadIncrement.trim() ? parseDecimal(values.loadIncrement) : null;
    if (values.loadIncrement.trim() && increment === null) {
      return setMessage({ ok: false, text: m.invalidIncrement });
    }
    const input = {
      name: values.name,
      muscleGroup: values.muscleGroup,
      secondaryMuscles: values.secondaryMuscles,
      equipment: orNull(values.equipment),
      instructions: orNull(values.instructions),
      notes: orNull(values.notes),
      loadIncrementKg: increment,
    };
    try {
      const saved = editing
        ? await update.mutateAsync({ ...input, id: editing.id })
        : await create.mutateAsync(input);
      setValues(initialValues(null));
      setMessage({ ok: true, text: m.saved(saved.name) });
      onDone();
    } catch (err) {
      setMessage({ ok: false, text: exerciseErrorByCode[errorCode(err) ?? ''] ?? m.genericError });
    }
  };

  return (
    <Card aria-label={editing ? m.editTitle : m.formTitle} className="flex-[1_1_340px]">
      <h2 className="text-lg font-semibold">{editing ? m.editTitle : m.formTitle}</h2>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <Field id="exercise-name" label={m.name}>
          <Input
            id="exercise-name"
            maxLength={60}
            placeholder={m.namePlaceholder}
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field id="exercise-group" label={m.mainGroup}>
          <NativeSelect
            id="exercise-group"
            value={values.muscleGroup}
            onChange={(e) => set({ muscleGroup: e.target.value as MuscleGroup })}
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {muscleGroupLabels[g]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">
            {m.secondaryGroups} <span className="font-normal text-text-muted">{m.optional}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {GROUPS.filter((g) => g !== values.muscleGroup).map((g) => {
              const on = values.secondaryMuscles.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSecondary(g)}
                  className={
                    on
                      ? 'min-h-9 rounded-full border-2 border-brand bg-brand-soft px-3 text-sm font-semibold text-brand-soft-foreground'
                      : 'min-h-9 rounded-full border border-border bg-surface px-3 text-sm hover:border-brand/60'
                  }
                >
                  {muscleGroupLabels[g]}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Field id="exercise-equipment" label={m.equipmentLabel} hint={m.optional}>
            <Input
              id="exercise-equipment"
              maxLength={40}
              placeholder={m.equipmentPlaceholder}
              value={values.equipment}
              onChange={(e) => set({ equipment: e.target.value })}
            />
          </Field>
          <Field id="exercise-increment" label={m.incrementLabel} hint={m.optional}>
            <Input
              id="exercise-increment"
              inputMode="decimal"
              aria-describedby="exercise-increment-hint"
              value={values.loadIncrement}
              onChange={(e) => set({ loadIncrement: e.target.value })}
            />
          </Field>
        </div>
        <p id="exercise-increment-hint" className="-mt-2 text-sm text-text-muted">
          {m.incrementHint}
        </p>
        <Field id="exercise-instructions" label={m.instructions} hint={m.optional}>
          <textarea
            id="exercise-instructions"
            maxLength={1000}
            className={textarea}
            value={values.instructions}
            onChange={(e) => set({ instructions: e.target.value })}
          />
        </Field>
        <Field id="exercise-notes" label={m.notes} hint={m.optional}>
          <textarea
            id="exercise-notes"
            maxLength={500}
            className={textarea}
            value={values.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </Field>
        {message && (
          <p
            role={message.ok ? 'status' : 'alert'}
            className={message.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
          >
            {message.text}
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
      </form>
    </Card>
  );
}
