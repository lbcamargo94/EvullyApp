import { useAppSettings, useUpdateAppSettings } from '@evully/app-core';
import { inactivityLockOptions, type UpdateAppSettingsInput } from '@evully/contracts';
import { Card, ChoiceCard } from '@evully/ui';
import { generalSettingsMessages as m } from './messages.pt-BR';
import { useSaveFeedback } from './settings-feedback';

const THEMES = ['system', 'light', 'dark'] as const;

/** Settings › Geral: theme and inactivity lock (README §8.4). Backup comes right after. */
export function GeneralSection() {
  const { data: settings } = useAppSettings();
  const update = useUpdateAppSettings();
  const feedback = useSaveFeedback();
  if (!settings) return null;
  const save = (input: UpdateAppSettingsInput) =>
    void feedback.run(() => update.mutateAsync(input));

  return (
    <Card aria-labelledby="general-title" className="gap-6">
      <section className="flex flex-col gap-3">
        <h2 id="general-title" className="text-lg font-semibold">
          {m.themeTitle}
        </h2>
        <div
          role="radiogroup"
          aria-labelledby="general-title"
          className="grid gap-3 sm:grid-cols-3"
        >
          {THEMES.map((theme) => (
            <ChoiceCard
              key={theme}
              checked={settings.theme === theme}
              disabled={update.isPending}
              title={m.themes[theme].title}
              description={m.themes[theme].description}
              onClick={() => settings.theme !== theme && save({ theme })}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex flex-col gap-1">
          <h2 id="inactivity-title" className="text-lg font-semibold">
            {m.inactivityTitle}
          </h2>
          <p className="text-sm text-text-muted">{m.inactivityHint}</p>
        </div>
        <div
          role="radiogroup"
          aria-labelledby="inactivity-title"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {inactivityLockOptions.map((minutes) => (
            <ChoiceCard
              key={minutes}
              checked={settings.inactivityLockMinutes === minutes}
              disabled={update.isPending}
              title={m.inactivity(minutes)}
              onClick={() =>
                settings.inactivityLockMinutes !== minutes &&
                save({ inactivityLockMinutes: minutes })
              }
            />
          ))}
        </div>
      </section>
      {feedback.node}
    </Card>
  );
}
