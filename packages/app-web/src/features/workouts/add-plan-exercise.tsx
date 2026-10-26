import { errorCode, usePlanMutation } from '@evully/app-core';
import type { ExerciseDto, PrescriptionDto } from '@evully/contracts';
import { Button } from '@evully/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ExercisePicker } from './exercise-picker';
import { planErrorByCode, planMessages as m, prescriptionMessages } from './messages.pt-BR';
import { DEFAULT_PRESCRIPTION, PrescriptionForm } from './prescription-form';

/** Pick an exercise from the library, then its prescription. */
export function AddPlanExercise({ profileId, dayId }: { profileId: string; dayId: string }) {
  const add = usePlanMutation(
    profileId,
    (api, pid, input: { exerciseId: string; prescription: PrescriptionDto }) =>
      api.addExercise(pid, dayId, input.exerciseId, input.prescription),
  );
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<ExerciseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setPicked(null);
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

  return <ExercisePicker profileId={profileId} onPick={setPicked} onCancel={close} />;
}
