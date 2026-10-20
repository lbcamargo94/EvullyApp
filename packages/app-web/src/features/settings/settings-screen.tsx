import { useCurrentProfile } from '@evully/app-core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@evully/ui';
import { useSearchParams } from 'react-router';
import { BackupSection } from './backup-section';
import { settingsMessages as m } from './messages.pt-BR';
import { ProjectSection } from './project-section';
import { TrackingSection } from './tracking-section';

const TABS = ['tracking', 'project', 'general'] as const;
type Tab = (typeof TABS)[number];

/** Settings (README §8.7). The tab lives in the URL so links can open one (`?tab=general`). */
export function SettingsScreen() {
  const { profileId } = useCurrentProfile();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.find((t) => t === requested) ?? 'tracking';

  return (
    <>
      <h1 className="text-[26px] font-semibold">{m.title}</h1>
      <Tabs
        value={tab}
        onValueChange={(value) => setParams({ tab: value }, { replace: true })}
        className="flex max-w-3xl flex-col gap-6"
      >
        <TabsList aria-label={m.title}>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {m.tabs[t]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="tracking">
          {profileId && <TrackingSection profileId={profileId} />}
        </TabsContent>
        <TabsContent value="project">
          {profileId && <ProjectSection profileId={profileId} />}
        </TabsContent>
        <TabsContent value="general">
          <BackupSection />
        </TabsContent>
      </Tabs>
    </>
  );
}
