import {
  useAppSettings,
  useCheckForUpdates,
  useInstallUpdate,
  useUpdateAppSettings,
  useUpdateStatus,
} from '@evully/app-core';
import type { UpdateChannel, UpdateStatus } from '@evully/contracts';
import { Button, Field, NativeSelect, ProgressBar } from '@evully/ui';
import { Download } from 'lucide-react';
import { updateMessages as m } from './messages.pt-BR';

function statusText(s: UpdateStatus): string {
  switch (s.state) {
    case 'disabled':
      return m.disabled;
    case 'checking':
      return m.checking;
    case 'downloading':
      return m.downloading(s.availableVersion ?? '', s.progress ?? 0);
    case 'ready':
      return m.ready(s.availableVersion ?? '');
    case 'error':
      return m.errors[s.error ?? 'unknown'];
    case 'up_to_date':
      return m.upToDate;
    default:
      return m.idle;
  }
}

/** Settings › Sobre: update status, manual check and channel (README §33). */
export function UpdateSection() {
  const { data: status } = useUpdateStatus();
  const { data: settings } = useAppSettings();
  const check = useCheckForUpdates();
  const saveSettings = useUpdateAppSettings();
  if (!status || !settings) return null;
  const disabled = status.state === 'disabled';
  const busy = status.state === 'checking' || status.state === 'downloading';

  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="text-sm text-text-muted">
        {statusText(status)}
        {status.checkedAt && status.state === 'up_to_date' && (
          <> · {m.checkedAt(status.checkedAt)}</>
        )}
      </p>
      {status.state === 'downloading' && (
        <ProgressBar value={status.progress ?? 0} max={100} label={m.progressLabel} />
      )}
      <div className="flex flex-wrap items-end gap-3">
        {status.state === 'ready' ? (
          <InstallButton />
        ) : (
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || busy || check.isPending}
            onClick={() => check.mutate()}
          >
            {m.check}
          </Button>
        )}
        <Field id="update-channel" label={m.channel}>
          <NativeSelect
            id="update-channel"
            value={settings.updateChannel}
            disabled={saveSettings.isPending}
            onChange={(e) =>
              saveSettings.mutate({ updateChannel: e.target.value as UpdateChannel })
            }
          >
            <option value="prerelease">{m.prerelease}</option>
            <option value="stable">{m.stable}</option>
          </NativeSelect>
        </Field>
      </div>
      <p className="text-xs text-text-muted">{m.hint}</p>
    </div>
  );
}

export function InstallButton() {
  const install = useInstallUpdate();
  return (
    <Button type="button" disabled={install.isPending} onClick={() => install.mutate()}>
      <Download aria-hidden="true" className="size-4" />
      {install.isPending ? m.installing : m.install}
    </Button>
  );
}
