import {
  errorCode,
  useAnswerWorkoutQuestionnaire,
  useSkipWorkoutQuestionnaire,
} from '@evully/app-core';
import type { WorkoutPreferencesDto } from '@evully/contracts';
import { Button, ChoiceCard } from '@evully/ui';
import { useState } from 'react';
import { workoutQuestionnaireMessages as m } from './messages.pt-BR';

type Prefs = Pick<WorkoutPreferencesDto, 'experience' | 'daysPerWeek' | 'location' | 'equipment'>;
type Equipment = Prefs['equipment'][number];

const EXPERIENCE = Object.keys(m.experience) as NonNullable<Prefs['experience']>[];
const LOCATIONS = Object.keys(m.location) as NonNullable<Prefs['location']>[];
const EQUIPMENT = Object.keys(m.equipment) as Equipment[];
const DAYS = [1, 2, 3, 4, 5, 6, 7];

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-semibold">
        {title} <span className="text-sm font-normal text-text-muted">{m.optional}</span>
      </legend>
      {children}
    </fieldset>
  );
}

/** The workouts module questionnaire (README §10): every answer is optional. */
export function WorkoutQuestionnaire({
  profileId,
  initial,
  onDone,
  onCancel,
}: {
  profileId: string;
  initial: Prefs;
  onDone?: () => void;
  /** Present when redoing it from Settings; otherwise "skip" is offered. */
  onCancel?: () => void;
}) {
  const answer = useAnswerWorkoutQuestionnaire(profileId);
  const skip = useSkipWorkoutQuestionnaire(profileId);
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [error, setError] = useState<string | null>(null);
  const busy = answer.isPending || skip.isPending;
  const set = (patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch }));

  const toggleEquipment = (e: Equipment) =>
    set({
      equipment: prefs.equipment.includes(e)
        ? prefs.equipment.filter((x) => x !== e)
        : e === 'none'
          ? ['none']
          : [...prefs.equipment.filter((x) => x !== 'none'), e],
    });

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      onDone?.();
    } catch (e) {
      setError(
        errorCode(e) === 'workout_questionnaire.days_out_of_range' ? m.invalidDays : m.genericError,
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Question title={m.experienceTitle}>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
          {EXPERIENCE.map((x) => (
            <ChoiceCard
              key={x}
              checked={prefs.experience === x}
              title={m.experience[x]}
              onClick={() => set({ experience: x })}
            />
          ))}
        </div>
      </Question>
      <Question title={m.daysTitle}>
        <div role="radiogroup" className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((d) => (
            <ChoiceCard
              key={d}
              checked={prefs.daysPerWeek === d}
              title={m.days(d)}
              onClick={() => set({ daysPerWeek: d })}
            />
          ))}
        </div>
      </Question>
      <Question title={m.locationTitle}>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
          {LOCATIONS.map((x) => (
            <ChoiceCard
              key={x}
              checked={prefs.location === x}
              title={m.location[x]}
              onClick={() => set({ location: x })}
            />
          ))}
        </div>
      </Question>
      <Question title={m.equipmentTitle}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EQUIPMENT.map((x) => (
            <ChoiceCard
              key={x}
              multiple
              checked={prefs.equipment.includes(x)}
              title={m.equipment[x]}
              onClick={() => toggleEquipment(x)}
            />
          ))}
        </div>
      </Question>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={busy}
          onClick={() => void run(() => answer.mutateAsync(prefs))}
        >
          {answer.isPending ? m.saving : m.save}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {m.cancel}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void run(() => skip.mutateAsync(undefined))}
          >
            {m.skip}
          </Button>
        )}
      </div>
    </div>
  );
}
