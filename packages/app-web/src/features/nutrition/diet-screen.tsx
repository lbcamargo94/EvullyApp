import { useCurrentProfile } from '@evully/app-core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@evully/ui';
import { useSearchParams } from 'react-router';
import { DayView } from './day-view';
import { FavoritesList } from './favorites-list';
import { FoodsCatalog } from './foods-catalog';
import { dietMessages as m } from './messages.pt-BR';

const TABS = ['day', 'favorites', 'foods'] as const;
type Tab = (typeof TABS)[number];

/** Diet (README §9, §16.2): the day's meals and the household food catalog. */
export function DietScreen() {
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
          <DayView profileId={profileId} />
        </TabsContent>
        <TabsContent value="favorites">
          <FavoritesList profileId={profileId} />
        </TabsContent>
        <TabsContent value="foods">
          <FoodsCatalog />
        </TabsContent>
      </Tabs>
    </>
  );
}
