import { useCurrentProfile } from '@evully/app-core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@evully/ui';
import { useSearchParams } from 'react-router';
import { ExerciseLibrary } from './exercise-library';
import { workoutMessages as m } from './messages.pt-BR';
import { PlansTab } from './plans-tab';

const TABS = ['plans', 'exercises'] as const;
type Tab = (typeof TABS)[number];

/** Workouts (README §10, §16.2). Sessions arrive in the next V0.3 delivery. */
export function WorkoutsScreen() {
  const { profileId } = useCurrentProfile();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.find((t) => t === requested) ?? 'plans';
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
