import { errorCode, useDeactivateExercise } from '@evully/app-core';
import type { ExerciseDto } from '@evully/contracts';
import { Button, ConfirmDialog } from '@evully/ui';
import { ChartLine, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ExerciseHistoryPanel } from './exercise-history-panel';
import {
  exerciseErrorByCode,
  exerciseMessages as m,
  historyMessages,
  muscleGroupLabels,
} from './messages.pt-BR';

const kg = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/** One exercise; details expand in place. Only the profile's own can be edited. */
export function ExerciseRow({
  profileId,
  exercise: e,
  onEdit,
}: {
  profileId: string;
  exercise: ExerciseDto;
  onEdit: (exercise: ExerciseDto) => void;
}) {
  const remove = useDeactivateExercise(profileId);
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deactivate = async () => {
    try {
      await remove.mutateAsync(e.id);
    } catch (err) {
      setError(exerciseErrorByCode[errorCode(err) ?? ''] ?? m.genericError);
    }
    setConfirming(false);
  };

  return (
    <li className="flex flex-col gap-2 border-t border-border py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-label={m.details(e.name)}
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-brand"
        >
          <ChevronDown
            aria-hidden="true"
            className={open ? 'size-4 rotate-180 text-text-muted' : 'size-4 text-text-muted'}
          />
          <span className="font-medium">{e.name}</span>
          {e.equipment && <span className="text-sm text-text-muted">· {e.equipment}</span>}
        </button>
        <span
          className={
            e.isSystem
              ? 'rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted'
              : 'rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-soft-foreground'
          }
          title={e.isSystem ? m.systemHint : undefined}
        >
          {e.isSystem ? m.system : m.own}
        </span>
        <Button
          type="button"
          variant={showHistory ? 'secondary' : 'ghost'}
          className="min-h-9 px-2"
          aria-label={historyMessages.open(e.name)}
          aria-pressed={showHistory}
          onClick={() => setShowHistory((v) => !v)}
        >
          <ChartLine aria-hidden="true" className="size-4" />
        </Button>
        {!e.isSystem && (
          <>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.edit(e.name)}
              onClick={() => onEdit(e)}
            >
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.remove(e.name)}
              onClick={() => setConfirming(true)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </>
        )}
      </div>
      {open && <Details exercise={e} />}
      {showHistory && <ExerciseHistoryPanel profileId={profileId} exerciseId={e.id} />}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={m.removeTitle}
        description={m.removeBody(e.name)}
        confirmLabel={m.removeConfirm}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void deactivate()}
      />
    </li>
  );
}

function Details({ exercise: e }: { exercise: ExerciseDto }) {
  return (
    <div className="ml-6 flex flex-col gap-2 rounded-md bg-surface-muted p-3 text-sm">
      {e.secondaryMuscles.length > 0 && (
        <p>
          <span className="text-text-muted">{m.secondary}: </span>
          {e.secondaryMuscles.map((g) => muscleGroupLabels[g]).join(', ')}
        </p>
      )}
      {e.loadIncrementKg !== null && (
        <p>
          <span className="text-text-muted">{m.increment}: </span>
          {m.incrementValue(kg.format(e.loadIncrementKg))}
        </p>
      )}
      {e.instructions && (
        <div>
          <p className="font-semibold">{m.instructionsTitle}</p>
          <p className="whitespace-pre-line">{e.instructions}</p>
        </div>
      )}
      {e.notes && <p className="whitespace-pre-line text-text-muted">{e.notes}</p>}
    </div>
  );
}
