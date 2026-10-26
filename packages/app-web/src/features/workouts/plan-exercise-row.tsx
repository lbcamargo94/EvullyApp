import { errorCode, usePlanMutation } from '@evully/app-core';
import type { PrescriptionDto, WorkoutPlanDto } from '@evully/contracts';
import { ChevronDown, ChevronUp, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from './day-editor';
import {
  formatPrescription,
  planErrorByCode,
  planMessages as m,
  prescriptionMessages,
} from './messages.pt-BR';
import { PrescriptionForm } from './prescription-form';

type Item = WorkoutPlanDto['days'][number]['exercises'][number];
const errorText = (e: unknown) => planErrorByCode[errorCode(e) ?? ''] ?? m.genericError;

/** "Supino reto — 3 × 6–8 · RIR 1–2 · descanso 150–180 s", editable in place. */
export function PlanExerciseRow({
  profileId,
  item,
  isFirst,
  isLast,
}: {
  profileId: string;
  item: Item;
  isFirst: boolean;
  isLast: boolean;
}) {
  const update = usePlanMutation(profileId, (api, pid, p: PrescriptionDto) =>
    api.updateExercise(pid, item.id, p),
  );
  const move = usePlanMutation(profileId, (api, pid, direction: 'up' | 'down') =>
    api.moveExercise(pid, item.id, direction),
  );
  const remove = usePlanMutation(profileId, (api, pid, _: undefined) =>
    api.removeExercise(pid, item.id),
  );
  const [editing, setEditing] = useState(false);
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
    <li className="flex flex-col gap-2 border-t border-border py-2">
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex min-w-48 flex-1 flex-col">
          <span className="font-medium">
            {item.exerciseName}
            {!item.exerciseActive && (
              <span className="ml-2 text-xs font-normal text-text-muted">({m.inactive})</span>
            )}
          </span>
          <span className="text-sm text-text-muted tabular-nums">
            {formatPrescription(item.prescription)}
            {item.prescription.notes && ` · ${item.prescription.notes}`}
          </span>
        </div>
        <IconButton
          label={m.moveUp(item.exerciseName)}
          disabled={isFirst}
          onClick={() => void run(() => move.mutateAsync('up'))}
        >
          <ChevronUp aria-hidden="true" className="size-4" />
        </IconButton>
        <IconButton
          label={m.moveDown(item.exerciseName)}
          disabled={isLast}
          onClick={() => void run(() => move.mutateAsync('down'))}
        >
          <ChevronDown aria-hidden="true" className="size-4" />
        </IconButton>
        <IconButton label={m.editPrescription(item.exerciseName)} onClick={() => setEditing(true)}>
          <Pencil aria-hidden="true" className="size-4" />
        </IconButton>
        <IconButton
          label={m.removeExercise(item.exerciseName)}
          onClick={() => void run(() => remove.mutateAsync(undefined))}
        >
          <X aria-hidden="true" className="size-4" />
        </IconButton>
      </div>
      {editing && (
        <PrescriptionForm
          initial={item.prescription}
          submitLabel={prescriptionMessages.save}
          busy={update.isPending}
          error={error}
          onSubmit={(p) =>
            void run(() => update.mutateAsync(p)).then((ok) => ok && setEditing(false))
          }
          onCancel={() => {
            setEditing(false);
            setError(null);
          }}
        />
      )}
      {!editing && error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}
