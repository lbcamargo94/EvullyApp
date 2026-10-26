import { errorCode, usePlanMutation } from '@evully/app-core';
import type { WorkoutPlanDto } from '@evully/contracts';
import { Button, Card, ConfirmDialog, Input, NativeSelect } from '@evully/ui';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AddPlanExercise } from './add-plan-exercise';
import { planErrorByCode, planMessages as m, weekdayLabels } from './messages.pt-BR';
import { PlanExerciseRow } from './plan-exercise-row';

type Day = WorkoutPlanDto['days'][number];
const errorText = (e: unknown) => planErrorByCode[errorCode(e) ?? ''] ?? m.genericError;

export function DayEditor({
  profileId,
  day,
  isFirst,
  isLast,
}: {
  profileId: string;
  day: Day;
  isFirst: boolean;
  isLast: boolean;
}) {
  const update = usePlanMutation(
    profileId,
    (api, pid, values: { name: string; weekday: number | null }) =>
      api.updateDay(pid, day.id, values),
  );
  const move = usePlanMutation(profileId, (api, pid, direction: 'up' | 'down') =>
    api.moveDay(pid, day.id, direction),
  );
  const remove = usePlanMutation(profileId, (api, pid, _: undefined) => api.removeDay(pid, day.id));
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError(null);
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    }
  };

  return (
    <Card aria-label={day.name} className="gap-3">
      {editing ? (
        <DayForm
          initial={day}
          submitLabel={m.save}
          busy={update.isPending}
          onSubmit={(values) =>
            void run(() => update.mutateAsync(values)).then((ok) => ok && setEditing(false))
          }
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          <h3 className="flex-1 text-base font-semibold">
            {day.name}
            {day.weekday !== null && (
              <span className="ml-2 text-sm font-normal text-text-muted">
                {weekdayLabels[day.weekday - 1]}
              </span>
            )}
          </h3>
          <IconButton
            label={m.moveUp(day.name)}
            disabled={isFirst}
            onClick={() => void run(() => move.mutateAsync('up'))}
          >
            <ChevronUp aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton
            label={m.moveDown(day.name)}
            disabled={isLast}
            onClick={() => void run(() => move.mutateAsync('down'))}
          >
            <ChevronDown aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton label={m.editDay(day.name)} onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton label={m.removeDay(day.name)} onClick={() => setConfirming(true)}>
            <Trash2 aria-hidden="true" className="size-4" />
          </IconButton>
        </div>
      )}
      {day.exercises.length === 0 && <p className="text-sm text-text-muted">{m.noExercises}</p>}
      {day.exercises.length > 0 && (
        <ul className="flex flex-col">
          {day.exercises.map((item, index) => (
            <PlanExerciseRow
              key={item.id}
              profileId={profileId}
              item={item}
              isFirst={index === 0}
              isLast={index === day.exercises.length - 1}
            />
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <AddPlanExercise profileId={profileId} dayId={day.id} />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={m.removeDayTitle}
        description={m.removeDayBody(day.name)}
        confirmLabel={m.remove}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() =>
          void run(() => remove.mutateAsync(undefined)).then(() => setConfirming(false))
        }
      />
    </Card>
  );
}

export function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-9 px-2"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function DayForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  initial: { name: string; weekday: number | null };
  submitLabel: string;
  busy: boolean;
  onSubmit: (day: { name: string; weekday: number | null }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [weekday, setWeekday] = useState(initial.weekday === null ? '' : String(initial.weekday));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name, weekday: weekday ? Number(weekday) : null });
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <Input
        autoFocus
        aria-label={m.dayName}
        placeholder={m.dayNamePlaceholder}
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="max-w-64 flex-1"
      />
      <NativeSelect
        aria-label={m.weekday}
        value={weekday}
        onChange={(e) => setWeekday(e.target.value)}
        className="w-44"
      >
        <option value="">{m.noWeekday}</option>
        {weekdayLabels.map((label, i) => (
          <option key={label} value={i + 1}>
            {label}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" disabled={busy}>
        {submitLabel}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        {m.cancel}
      </Button>
    </form>
  );
}
