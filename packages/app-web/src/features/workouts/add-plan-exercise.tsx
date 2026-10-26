import { errorCode, foodSearchKey, useExercises, usePlanMutation } from '@evully/app-core';
import type { ExerciseDto, PrescriptionDto } from '@evully/contracts';
import { Button, Input } from '@evully/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  muscleGroupLabels,
  planErrorByCode,
  planMessages as m,
  prescriptionMessages,
} from './messages.pt-BR';
import { DEFAULT_PRESCRIPTION, PrescriptionForm } from './prescription-form';

const MAX_RESULTS = 8;

/** Pick an exercise from the library, then its prescription. */
export function AddPlanExercise({ profileId, dayId }: { profileId: string; dayId: string }) {
  const { data: exercises = [] } = useExercises(profileId);
  const add = usePlanMutation(
    profileId,
    (api, pid, input: { exerciseId: string; prescription: PrescriptionDto }) =>
      api.addExercise(pid, dayId, input.exerciseId, input.prescription),
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<ExerciseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setPicked(null);
    setQuery('');
    setError(null);
  };

  if (!open) {
    return (
      <Button type="button" variant="ghost" className="self-start" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" className="size-4" />
        {m.addExercise}
      </Button>
    );
  }

  if (picked) {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-medium">{picked.name}</span>
        <PrescriptionForm
          initial={DEFAULT_PRESCRIPTION}
          submitLabel={prescriptionMessages.add}
          busy={add.isPending}
          error={error}
          onSubmit={(prescription) =>
            void add
              .mutateAsync({ exerciseId: picked.id, prescription })
              .then(close)
              .catch((e: unknown) =>
                setError(planErrorByCode[errorCode(e) ?? ''] ?? m.genericError),
              )
          }
          onCancel={close}
        />
      </div>
    );
  }

  const q = foodSearchKey(query);
  const matches = exercises
    .filter((e) => !q || foodSearchKey(`${e.name} ${muscleGroupLabels[e.muscleGroup]}`).includes(q))
    .slice(0, MAX_RESULTS);

  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-muted p-3">
      <Input
        autoFocus
        type="search"
        aria-label={m.searchExercise}
        placeholder={m.searchExercise}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && close()}
      />
      {matches.length === 0 && <p className="text-sm text-text-muted">{m.noMatch}</p>}
      <ul className="flex flex-col">
        {matches.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => setPicked(e)}
              className="flex w-full justify-between gap-3 rounded-sm px-2 py-1.5 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span>{e.name}</span>
              <span className="text-sm text-text-muted">{muscleGroupLabels[e.muscleGroup]}</span>
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="ghost" className="self-start" onClick={close}>
        {m.cancel}
      </Button>
    </div>
  );
}
