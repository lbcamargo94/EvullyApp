import { useCurrentProfile, useNutritionPreferences } from '@evully/app-core';
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@evully/ui';
import { useSearchParams } from 'react-router';
import { DayView } from './day-view';
import { FavoritesList } from './favorites-list';
import { FoodsCatalog } from './foods-catalog';
import { dietMessages as m, preferencesMessages } from './messages.pt-BR';
import { NutritionQuestionnaire } from './nutrition-questionnaire';

const TABS = ['day', 'favorites', 'foods'] as const;
type Tab = (typeof TABS)[number];

/** Diet (README §9, §16.2): the day's meals and the household food catalog. */
export function DietScreen() {
  const { profileId } = useCurrentProfile();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.find((t) => t === requested) ?? 'day';
  const { data: prefs } = useNutritionPreferences(profileId);
  if (!profileId || !prefs) return null;

  // First visit of the profile: the module questionnaire (README §9).
  if (prefs.status === 'pending') {
    return (
      <>
        <h1 className="text-[26px] font-semibold">{m.title}</h1>
        <Card aria-labelledby="nutrition-intro" className="max-w-3xl gap-5 p-8">
          <div className="flex flex-col gap-1">
            <h2 id="nutrition-intro" className="text-xl font-semibold">
              {preferencesMessages.introTitle}
            </h2>
            <p className="text-text-muted">{preferencesMessages.introBody}</p>
          </div>
          <NutritionQuestionnaire profileId={profileId} initial={prefs} />
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
