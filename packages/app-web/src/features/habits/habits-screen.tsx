import { useCurrentProfile } from '@evully/app-core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@evully/ui';
import { useSearchParams } from 'react-router';
import { HabitDayView } from './habit-day-view';
import { HabitManager } from './habit-manager';
import { habitMessages as m } from './messages.pt-BR';

const TABS = ['day', 'manage'] as const;
type Tab = (typeof TABS)[number];

/** Habits (README §11.2, §16.2): the day's checklist and the habit list. */
export function HabitsScreen() {
  const { profileId } = useCurrentProfile();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.find((t) => t === requested) ?? 'day';
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
        <TabsContent value="day">
          <HabitDayView profileId={profileId} />
        </TabsContent>
        <TabsContent value="manage">
          <HabitManager profileId={profileId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
