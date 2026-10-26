import { errorCode, usePlanMutation } from '@evully/app-core';
import type { WorkoutPlanDto } from '@evully/contracts';
import { Button, Card, Input } from '@evully/ui';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DayEditor, DayForm } from './day-editor';
import { planErrorByCode, planMessages as m } from './messages.pt-BR';

const errorText = (e: unknown) => planErrorByCode[errorCode(e) ?? ''] ?? m.genericError;

/** Edits one plan: name, archive, days and their exercises. */
export function PlanEditor({
  profileId,
  plan,
  onBack,
}: {
  profileId: string;
  plan: WorkoutPlanDto;
  onBack: () => void;
}) {
  const update = usePlanMutation(
    profileId,
    (api, pid, values: { name: string; status: 'active' | 'archived' }) =>
      api.update(pid, plan.id, values),
  );
  const addDay = usePlanMutation(
    profileId,
    (api, pid, day: { name: string; weekday: number | null }) => api.addDay(pid, plan.id, day),
  );
  const [renaming, setRenaming] = useState(false);
  const [adding, setAdding] = useState(false);
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {m.back}
        </Button>
        {renaming ? (
          <RenameForm
            name={plan.name}
            onSave={(name) =>
              void run(() => update.mutateAsync({ name, status: plan.status })).then(
                (ok) => ok && setRenaming(false),
              )
            }
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <h2 className="flex-1 text-xl font-semibold">{plan.name}</h2>
        )}
        {!renaming && (
          <Button type="button" variant="ghost" onClick={() => setRenaming(true)}>
            {m.rename}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          disabled={update.isPending}
          onClick={() =>
            void run(() =>
              update.mutateAsync({
                name: plan.name,
                status: plan.status === 'active' ? 'archived' : 'active',
              }),
            )
          }
        >
          {plan.status === 'active' ? m.archive : m.restore}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {plan.days.map((day, index) => (
        <DayEditor
          key={day.id}
          profileId={profileId}
          day={day}
          isFirst={index === 0}
          isLast={index === plan.days.length - 1}
        />
      ))}
      {adding ? (
        <Card>
          <DayForm
            initial={{ name: '', weekday: null }}
            submitLabel={m.addDay}
            busy={addDay.isPending}
            onSubmit={(day) =>
              void run(() => addDay.mutateAsync(day)).then((ok) => ok && setAdding(false))
            }
            onCancel={() => setAdding(false)}
          />
        </Card>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          onClick={() => setAdding(true)}
        >
          <Plus aria-hidden="true" className="size-4" />
          {m.addDay}
        </Button>
      )}
    </div>
  );
}

function RenameForm({
  name,
  onSave,
  onCancel,
}: {
  name: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(name);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(value);
  };
  return (
    <form onSubmit={submit} className="flex flex-1 flex-wrap items-center gap-2">
      <Input
        autoFocus
        aria-label={m.planName}
        maxLength={60}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-80"
      />
      <Button type="submit">{m.save}</Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        {m.cancel}
      </Button>
    </form>
  );
}
