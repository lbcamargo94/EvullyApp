import { useWorkoutPreferences } from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { useState } from 'react';
import { workoutQuestionnaireMessages as m } from '../workouts/messages.pt-BR';
import { WorkoutQuestionnaire } from '../workouts/workout-questionnaire';

/** Settings › Treino: current module answers and "redo" (README §10). */
export function WorkoutPreferencesSection({ profileId }: { profileId: string }) {
  const { data: prefs } = useWorkoutPreferences(profileId);
  const [editing, setEditing] = useState(false);
  if (!prefs) return null;

  return (
    <Card aria-labelledby="workout-prefs-title">
      <h2 id="workout-prefs-title" className="text-lg font-semibold">
        {m.settingsTitle}
      </h2>
      {editing ? (
        <WorkoutQuestionnaire
          profileId={profileId}
          initial={prefs}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-text-muted">{m.settingsExperience}</dt>
            <dd>{prefs.experience ? m.experience[prefs.experience] : m.notAnswered}</dd>
            <dt className="text-text-muted">{m.settingsDays}</dt>
            <dd>{prefs.daysPerWeek ? m.days(prefs.daysPerWeek) : m.notAnswered}</dd>
            <dt className="text-text-muted">{m.settingsLocation}</dt>
            <dd>{prefs.location ? m.location[prefs.location] : m.notAnswered}</dd>
            <dt className="text-text-muted">{m.settingsEquipment}</dt>
            <dd>
              {prefs.equipment.length
                ? prefs.equipment.map((e) => m.equipment[e]).join(', ')
                : m.notAnswered}
            </dd>
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
