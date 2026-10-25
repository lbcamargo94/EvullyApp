import { useNutritionPreferences } from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { useState } from 'react';
import { mealLabels, preferencesMessages as m } from '../nutrition/messages.pt-BR';
import { NutritionQuestionnaire } from '../nutrition/nutrition-questionnaire';

/** Settings › Nutrição: current module answers and "redo" (README §9). */
export function NutritionPreferencesSection({ profileId }: { profileId: string }) {
  const { data: prefs } = useNutritionPreferences(profileId);
  const [editing, setEditing] = useState(false);
  if (!prefs) return null;

  return (
    <Card aria-labelledby="nutrition-prefs-title">
      <h2 id="nutrition-prefs-title" className="text-lg font-semibold">
        {m.settingsTitle}
      </h2>
      {editing ? (
        <NutritionQuestionnaire
          profileId={profileId}
          initial={prefs}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-text-muted">{m.settingsMeals}</dt>
            <dd>{prefs.meals.map((meal) => mealLabels[meal]).join(', ')}</dd>
            <dt className="text-text-muted">{m.settingsWater}</dt>
            <dd>{prefs.trackWater ? m.yes : m.no}</dd>
            <dt className="text-text-muted">{m.settingsRestrictions}</dt>
            <dd>{prefs.restrictions ?? m.none}</dd>
          </dl>
          <Button
            type="button"
            variant="secondary"
            className="self-start"
            onClick={() => setEditing(true)}
          >
            {m.redo}
          </Button>
        </>
      )}
    </Card>
  );
}
