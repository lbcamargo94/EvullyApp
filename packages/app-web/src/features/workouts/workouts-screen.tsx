import { useCurrentProfile, useWorkoutPreferences } from '@evully/app-core';
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@evully/ui';
import { useSearchParams } from 'react-router';
import { ExerciseLibrary } from './exercise-library';
import { workoutMessages as m, workoutQuestionnaireMessages } from './messages.pt-BR';
import { WorkoutQuestionnaire } from './workout-questionnaire';
import { PlansTab } from './plans-tab';
import { SessionTab } from './session-tab';

const TABS = ['session', 'plans', 'exercises'] as const;
type Tab = (typeof TABS)[number];

/** Workouts (README §10, §16.2): train, plans and the exercise library. */
export function WorkoutsScreen() {
  const { profileId } = useCurrentProfile();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.find((t) => t === requested) ?? 'session';
  const { data: prefs } = useWorkoutPreferences(profileId);
  if (!profileId || !prefs) return null;

  // First visit of the profile: the module questionnaire (README §10).
  if (prefs.status === 'pending') {
    return (
      <>
        <h1 className="text-[26px] font-semibold">{m.title}</h1>
        <Card aria-labelledby="workouts-intro" className="max-w-3xl gap-5 p-8">
          <div className="flex flex-col gap-1">
            <h2 id="workouts-intro" className="text-xl font-semibold">
              {workoutQuestionnaireMessages.introTitle}
            </h2>
            <p className="text-text-muted">{workoutQuestionnaireMessages.introBody}</p>
          </div>
          <WorkoutQuestionnaire
            profileId={profileId}
            initial={prefs}
            onDone={() => setParams({ tab: 'plans' }, { replace: true })}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <h1 className="text-[26px] font-semibold">{m.title}</h1>
      <Tabs
        value={tab}
        onValueChange={(value) => setParams({ tab: value }, { replace: true })}
        className="flex flex-col gap-6"
      >
        <TabsList aria-label={m.title}>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {m.tabs[t]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="session">
          <SessionTab profileId={profileId} />
        </TabsContent>
        <TabsContent value="plans">
          <PlansTab profileId={profileId} />
        </TabsContent>
        <TabsContent value="exercises">
          <ExerciseLibrary profileId={profileId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
