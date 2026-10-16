import {
  useBackupStatus,
  useChooseExtraBackupDirectory,
  useCreateManualBackup,
  useSetAutomaticBackup,
} from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { useState } from 'react';
import { settingsMessages as m } from './messages.pt-BR';

const row = 'flex flex-wrap items-center justify-between gap-3 border-t border-border py-4';

/** Settings › Backup (README §8.7). Paths are picked with native dialogs in the main process. */
export function BackupSection() {
  const { data: status, available } = useBackupStatus();
  const manual = useCreateManualBackup();
  const setAutomatic = useSetAutomaticBackup();
  const chooseExtra = useChooseExtraBackupDirectory();
  const [feedback, setFeedback] = useState<string | null>(null);
  if (!available || !status) return null;

  const backupNow = async () => {
    setFeedback(null);
    try {
      const result = await manual.mutateAsync();
      if (result) setFeedback(m.backupDone(result.fileName));
    } catch {
      setFeedback(m.backupFailed);
    }
  };

  return (
    <Card aria-labelledby="backup-title" className="gap-0">
      <h2 id="backup-title" className="pb-3 text-lg font-semibold">
        {m.backupTitle}
      </h2>

      <div className={row}>
        <div className="flex flex-col gap-0.5">
          <strong className="font-semibold">{m.lastBackup}</strong>
          <span className="text-sm text-text-muted">
            {status.lastBackup
              ? m.lastBackupValue(status.lastBackup.at, m.kinds[status.lastBackup.kind])
              : m.never}
          </span>
        </div>
        <Button type="button" onClick={() => void backupNow()} disabled={manual.isPending}>
          {manual.isPending ? m.backingUp : m.backupNow}
        </Button>
      </div>
      {feedback && (
        <p role="status" className="pb-3 text-sm text-text-muted">
          {feedback}
        </p>
      )}

      <div className={row}>
        <label htmlFor="backup-automatic" className="flex flex-col gap-0.5">
          <strong className="font-semibold">{m.automatic}</strong>
          <span className="text-sm text-text-muted">{m.automaticHint}</span>
          <span className="text-sm break-all text-text-muted">
            {m.defaultFolder(status.defaultDirectory)}
          </span>
        </label>
        <input
          id="backup-automatic"
          type="checkbox"
          className="size-5.5 accent-brand"
          checked={status.automaticEnabled}
          disabled={setAutomatic.isPending}
          onChange={(e) => setAutomatic.mutate(e.target.checked)}
        />
      </div>

      <div className={row}>
        <div className="flex max-w-xl flex-col gap-0.5">
          <strong className="font-semibold">{m.extraFolder}</strong>
          <span className="text-sm break-all">{status.extraDirectory ?? m.noExtraFolder}</span>
          <span className="text-sm text-text-muted">{m.extraFolderHint}</span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={chooseExtra.isPending}
            onClick={() => chooseExtra.mutate(false)}
          >
            {status.extraDirectory ? m.changeFolder : m.chooseFolder}
          </Button>
          {status.extraDirectory && (
            <Button
              type="button"
              variant="ghost"
              disabled={chooseExtra.isPending}
              onClick={() => chooseExtra.mutate(true)}
            >
              {m.removeFolder}
            </Button>
          )}
        </div>
      </div>

      <p className="border-t border-border pt-4 text-sm text-text-muted">{m.restoreHint}</p>
    </Card>
  );
}
