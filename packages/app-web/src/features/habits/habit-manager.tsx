import { errorCode, parseDecimal, useHabitMutation, useHabits } from '@evully/app-core';
import type { HabitDto, HabitType } from '@evully/contracts';
import { Button, Card, ConfirmDialog, Field, Input, NativeSelect } from '@evully/ui';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  formatNumber,
  habitErrorByCode,
  habitMessages as m,
  habitTypeLabels,
} from './messages.pt-BR';

const TYPES = Object.keys(habitTypeLabels) as HabitType[];
const errorText = (e: unknown) => habitErrorByCode[errorCode(e) ?? ''] ?? m.genericError;

/** Create, edit, reorder and deactivate habits (README §11.2). */
export function HabitManager({ profileId }: { profileId: string }) {
  const { data: habits = [] } = useHabits(profileId);
  const [editing, setEditing] = useState<HabitDto | null>(null);
  return (
    <div className="flex flex-wrap items-start gap-6">
      <HabitForm
        key={editing?.id ?? 'new'}
        profileId={profileId}
        editing={editing}
        onDone={() => setEditing(null)}
      />
      <Card aria-labelledby="habit-list-title" className="flex-[2_1_380px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="habit-list-title" className="text-lg font-semibold">
            {m.list}
          </h2>
          <ExamplesButton profileId={profileId} />
        </div>
        <ul className="flex flex-col">
          {habits.map((h, i) => (
            <HabitItem
              key={h.id}
              profileId={profileId}
              habit={h}
              isFirst={i === 0}
              isLast={i === habits.length - 1}
              onEdit={setEditing}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function ExamplesButton({ profileId }: { profileId: string }) {
  const add = useHabitMutation(profileId, (api, pid, _: undefined) => api.addExamples(pid));
  return (
    <Button
      type="button"
      variant="secondary"
      title={m.examplesHint}
      disabled={add.isPending}
      onClick={() => add.mutate(undefined)}
    >
      {m.addExamples}
    </Button>
  );
}

function HabitItem({
  profileId,
  habit: h,
  isFirst,
  isLast,
  onEdit,
}: {
  profileId: string;
  habit: HabitDto;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (h: HabitDto) => void;
}) {
  const move = useHabitMutation(profileId, (api, pid, direction: 'up' | 'down') =>
    api.move(pid, h.id, direction),
  );
  const remove = useHabitMutation(profileId, (api, pid, _: undefined) => api.deactivate(pid, h.id));
  const [confirming, setConfirming] = useState(false);
  const icon = 'min-h-9 px-2';
  return (
    <li className="flex flex-wrap items-center gap-1 border-t border-border py-2">
      <span className="flex-1">
        <span className="font-medium">{h.name}</span>
        <span className="text-sm text-text-muted">
          {' · '}
          {habitTypeLabels[h.type]}
          {h.targetValue !== null &&
            ` · ${m.target(formatNumber(h.targetValue), h.type === 'duration' ? m.minutesUnit : h.unit)}`}
        </span>
      </span>
      <Button
        type="button"
        variant="ghost"
        className={icon}
        aria-label={m.moveUp(h.name)}
        disabled={isFirst}
        onClick={() => move.mutate('up')}
      >
        <ChevronUp aria-hidden="true" className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={icon}
        aria-label={m.moveDown(h.name)}
        disabled={isLast}
        onClick={() => move.mutate('down')}
      >
        <ChevronDown aria-hidden="true" className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={icon}
        aria-label={m.edit(h.name)}
        onClick={() => onEdit(h)}
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={icon}
        aria-label={m.remove(h.name)}
        onClick={() => setConfirming(true)}
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={m.removeTitle}
        description={m.removeBody(h.name)}
        confirmLabel={m.removeConfirm}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void remove.mutateAsync(undefined).finally(() => setConfirming(false))}
      />
    </li>
  );
}

type FormValues = { name: string; type: HabitType; unit: string; target: string };

const formValues = (h: HabitDto | null): FormValues =>
  h
    ? {
        name: h.name,
        type: h.type,
        unit: h.unit ?? '',
        target: h.targetValue === null ? '' : String(h.targetValue).replace('.', ','),
      }
    : { name: '', type: 'boolean', unit: '', target: '' };

const hasTarget = (type: HabitType) => type === 'quantity' || type === 'duration';

/** Builds the input; returns null when the target cannot be read. */
function toInput(v: FormValues) {
  const raw = hasTarget(v.type) ? v.target.trim() : '';
  const targetValue = raw ? parseDecimal(raw) : null;
  if (raw && targetValue === null) return null;
  return {
    name: v.name,
    type: v.type,
    unit: v.type === 'quantity' ? v.unit.trim() || null : null,
    targetValue,
  };
}

function HabitForm({
  profileId,
  editing,
  onDone,
}: {
  profileId: string;
  editing: HabitDto | null;
  onDone: () => void;
}) {
  const save = useHabitMutation(
    profileId,
    (
      api,
      pid,
      input: { name: string; type: HabitType; unit: string | null; targetValue: number | null },
    ) =>
      editing
        ? api.update({ profileId: pid, id: editing.id, ...input })
        : api.create({ profileId: pid, ...input }),
  );
  const [v, setV] = useState(() => formValues(editing));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (patch: Partial<FormValues>) => setV((c) => ({ ...c, ...patch }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const input = toInput(v);
    if (!input) return setMessage({ ok: false, text: m.invalidValue });
    try {
      const saved = await save.mutateAsync(input);
      setMessage({ ok: true, text: m.saved(saved.name) });
      if (!editing) setV(formValues(null));
      onDone();
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    }
  };

  return (
    <Card aria-label={editing ? m.editTitle : m.formTitle} className="flex-[1_1_300px]">
      <h2 className="text-lg font-semibold">{editing ? m.editTitle : m.formTitle}</h2>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <HabitFields v={v} set={set} />
        {message && (
          <p
            role={message.ok ? 'status' : 'alert'}
            className={message.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
          >
            {message.text}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending} className="flex-1">
            {editing ? m.saveEdit : m.save}
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

function HabitFields({ v, set }: { v: FormValues; set: (patch: Partial<FormValues>) => void }) {
  return (
    <>
      <Field id="habit-name" label={m.name}>
        <Input
          id="habit-name"
          maxLength={40}
          placeholder={m.namePlaceholder}
          value={v.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <Field id="habit-type" label={m.type}>
        <NativeSelect
          id="habit-type"
          value={v.type}
          onChange={(e) => set({ type: e.target.value as HabitType })}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {habitTypeLabels[t]}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {v.type === 'quantity' && (
        <Field id="habit-unit" label={m.unit} hint={m.optional}>
          <Input
            id="habit-unit"
            maxLength={15}
            placeholder={m.unitPlaceholder}
            value={v.unit}
            onChange={(e) => set({ unit: e.target.value })}
          />
        </Field>
      )}
      {hasTarget(v.type) && (
        <Field id="habit-target" label={m.targetLabel} hint={m.optional}>
          <Input
            id="habit-target"
            inputMode="decimal"
            value={v.target}
            onChange={(e) => set({ target: e.target.value })}
          />
        </Field>
      )}
    </>
  );
}
