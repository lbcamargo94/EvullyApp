import { useHealthSettings, useSetHealthEnabled } from '@evully/app-core';
import { Card, ConfirmDialog, Switch } from '@evully/ui';
import { useState } from 'react';
import { healthSettingsMessages as m } from './messages.pt-BR';

/**
 * Settings › Saúde (README §24): each profile turns the area on, after the
 * notice that the app does not diagnose. Turning it off only hides it.
 */
export function HealthSection({ profileId }: { profileId: string }) {
  const { data } = useHealthSettings(profileId);
  const setEnabled = useSetHealthEnabled(profileId);
  const [asking, setAsking] = useState(false);
  if (!data) return null;

  const turnOn = () =>
    setEnabled.mutate(true, {
      onSuccess: () => setAsking(false),
    });

  return (
    <Card aria-labelledby="health-settings-title">
      <div className="flex flex-col gap-1">
        <h2 id="health-settings-title" className="text-heading font-semibold">
          {m.title}
        </h2>
        <p className="text-caption text-text-muted">{m.description}</p>
      </div>
      <div className="flex items-start justify-between gap-4">
        <label htmlFor="health-enabled" className="flex flex-col gap-0.5">
          <span className="text-body font-semibold">{m.enable}</span>
          <span className="text-caption text-text-muted">{m.enableHint}</span>
        </label>
        <Switch
          id="health-enabled"
          checked={data.enabled}
          disabled={setEnabled.isPending}
          onChange={(e) => (e.target.checked ? setAsking(true) : setEnabled.mutate(false))}
        />
      </div>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title={m.noticeTitle}
        description={m.noticeBody}
        confirmLabel={m.noticeConfirm}
        cancelLabel={m.cancel}
        busy={setEnabled.isPending}
        onConfirm={turnOn}
      />
    </Card>
  );
}
