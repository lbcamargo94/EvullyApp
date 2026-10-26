import { useCurrentProfile } from '@evully/app-core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@evully/ui';
import { useSearchParams } from 'react-router';
import { ExerciseLibrary } from './exercise-library';
import { workoutMessages as m } from './messages.pt-BR';
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
  if (!profileId) return null;

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
