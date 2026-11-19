import {
  errorCode,
  usePrepareRestore,
  useRestorableBackups,
  useRestoreBackup,
} from '@evully/app-core';
import type { PrepareRestoreInput, RestorableBackups, RestorePreview } from '@evully/contracts';
import { Button, ConfirmDialog } from '@evully/ui';
import { useState } from 'react';
import { settingsMessages as m } from './messages.pt-BR';

const SHOWN = 8;

/**
 * "Restaurar backup" (README §14.2): pick a listed backup or a file, see what
 * it holds, confirm the replacement of all profiles; the app restarts to apply
 * it. `recovery` is the same panel on the recovery screen (README §14.2.1):
 * always open, and the damaged file is kept instead of backed up.
 */
export function RestorePanel({ recovery = false }: { recovery?: boolean }) {
  const [open, setOpen] = useState(recovery);
  const warning = recovery ? m.recoveryWarning : m.restoreWarning;
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: backups = [], isLoading } = useRestorableBackups(open);
  const prepare = usePrepareRestore();
  const restore = useRestoreBackup();

  const choose = async (input: PrepareRestoreInput) => {
    setError(null);
    try {
      setPreview(await prepare.mutateAsync(input));
    } catch (e) {
      setError(m.restoreErrors[errorCode(e) ?? ''] ?? m.restoreFailed);
    }
  };

  const confirm = async () => {
    if (!preview) return;
    try {
      await restore.mutateAsync(preview.token);
    } catch (e) {
      setPreview(null);
      setError(m.restoreErrors[errorCode(e) ?? ''] ?? m.restoreFailed);
    }
  };

  return (
    <div
      className={
        recovery ? 'flex flex-col gap-3' : 'flex flex-col gap-3 border-t border-border py-4'
      }
    >
      {!recovery && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex max-w-xl flex-col gap-0.5">
            <strong className="font-semibold">{m.restoreTitle}</strong>
            <span className="text-caption text-text-muted">{m.restoreHint}</span>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(!open)}>
            {open ? m.restoreClose : m.restoreOpen}
          </Button>
        </div>
      )}

      {open && (
        <BackupList
          backups={backups}
          loading={isLoading}
          busy={prepare.isPending}
          onChoose={(input) => void choose(input)}
        />
      )}

      {error && (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={preview !== null}
        onOpenChange={(next) => !next && !restore.isPending && setPreview(null)}
        title={m.restoreConfirmTitle}
        description={preview && <RestoreSummary preview={preview} warning={warning} />}
        confirmLabel={restore.isPending ? m.restoreRestarting : m.restoreConfirm}
        cancelLabel={m.restoreCancel}
        destructive
        busy={restore.isPending || restore.isSuccess}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}

function BackupList({
  backups,
  loading,
  busy,
  onChoose,
}: {
  backups: RestorableBackups;
  loading: boolean;
  busy: boolean;
  onChoose: (input: PrepareRestoreInput) => void;
}) {
  if (loading) return null;
  return (
    <div className="flex flex-col gap-2">
      {backups.length === 0 ? (
        <p className="text-caption text-text-muted">{m.restoreNone}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {backups.slice(0, SHOWN).map((b) => (
            <li
              key={`${b.folder}:${b.fileName}`}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
            >
              <span className="flex flex-col">
                <span className="text-body font-semibold">
                  {m.lastBackupValue(b.createdAt, m.kinds[b.kind])}
                </span>
                <span className="text-caption break-all text-text-muted">
                  {m.restoreFolder[b.folder]} · {b.fileName}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => onChoose({ from: 'list', folder: b.folder, fileName: b.fileName })}
              >
                {m.restoreChoose}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="ghost"
        className="self-start"
        disabled={busy}
        onClick={() => onChoose({ from: 'dialog' })}
      >
        {m.restoreBrowse}
      </Button>
    </div>
  );
}

function RestoreSummary({ preview, warning }: { preview: RestorePreview; warning: string }) {
  return (
    <span className="flex flex-col gap-2">
      <span>{m.restoreFrom(preview.fileName, preview.createdAt, preview.appVersion)}</span>
      <span>
        {preview.profiles.length > 0
          ? m.restoreProfiles(preview.profiles.join(', '))
          : m.restoreNoProfiles}
      </span>
      <span className="font-semibold text-text">{warning}</span>
    </span>
  );
}
