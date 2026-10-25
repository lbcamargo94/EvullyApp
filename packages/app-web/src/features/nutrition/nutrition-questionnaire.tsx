import {
  errorCode,
  useAnswerNutritionQuestionnaire,
  useSkipNutritionQuestionnaire,
} from '@evully/app-core';
import type { MealType, NutritionPreferencesDto } from '@evully/contracts';
import { Button, ChoiceCard, Field, Input } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { mealLabels, preferencesMessages as m } from './messages.pt-BR';

type StandardMeal = Exclude<MealType, 'custom'>;
const MEALS = Object.keys(mealLabels) as StandardMeal[];

const errorText = (e: unknown) =>
  ({
    'nutrition_questionnaire.meals_required': m.pickOne,
    'nutrition_questionnaire.restrictions_too_long': m.tooLong,
  })[errorCode(e) ?? ''] ?? m.genericError;

/** The nutrition module questionnaire (README §9): meals, water and a free note. */
export function NutritionQuestionnaire({
  profileId,
  initial,
  onDone,
  onCancel,
}: {
  profileId: string;
  initial: NutritionPreferencesDto;
  onDone?: () => void;
  /** Present when redoing it from Settings; otherwise "skip" is offered. */
  onCancel?: () => void;
}) {
  const answer = useAnswerNutritionQuestionnaire(profileId);
  const skip = useSkipNutritionQuestionnaire(profileId);
  const [meals, setMeals] = useState<StandardMeal[]>(initial.meals);
  const [trackWater, setTrackWater] = useState(initial.trackWater);
  const [restrictions, setRestrictions] = useState(initial.restrictions ?? '');
  const [error, setError] = useState<string | null>(null);
  const busy = answer.isPending || skip.isPending;

  const toggle = (meal: StandardMeal) =>
    setMeals((current) =>
      current.includes(meal) ? current.filter((x) => x !== meal) : [...current, meal],
    );

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      onDone?.();
    } catch (e) {
      setError(errorText(e));
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!meals.length) return setError(m.pickOne);
    void run(() =>
      answer.mutateAsync({ meals, trackWater, restrictions: restrictions.trim() || null }),
    );
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">{m.mealsTitle}</legend>
        <p className="text-sm text-text-muted">{m.mealsHint}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MEALS.map((meal) => (
            <ChoiceCard
              key={meal}
              multiple
              checked={meals.includes(meal)}
              title={mealLabels[meal]}
              onClick={() => toggle(meal)}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">{m.waterTitle}</legend>
        <div role="radiogroup" className="grid max-w-md grid-cols-2 gap-3">
          <ChoiceCard checked={trackWater} title={m.yes} onClick={() => setTrackWater(true)} />
          <ChoiceCard checked={!trackWater} title={m.no} onClick={() => setTrackWater(false)} />
        </div>
      </fieldset>
      <Field id="restrictions" label={m.restrictionsTitle} hint={m.optional}>
        <Input
          id="restrictions"
          maxLength={280}
          aria-describedby="restrictions-hint"
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
        />
      </Field>
      <p id="restrictions-hint" className="-mt-4 text-sm text-text-muted">
        {m.restrictionsHint}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
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
    </form>
  );
}
