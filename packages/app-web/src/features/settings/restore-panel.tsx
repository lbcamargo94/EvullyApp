import {
  errorCode,
  usePrepareRestore,
  useRestorableBackups,
  useRestoreBackup,
} from '@evully/app-core';
import type { PrepareRestoreInput, RestorePreview } from '@evully/contracts';
import { Button, ConfirmDialog } from '@evully/ui';
import { useState } from 'react';
import { settingsMessages as m } from './messages.pt-BR';

const SHOWN = 8;

/**
 * "Restaurar backup" (README §14.2): pick a listed backup or a file, see what
 * it holds, confirm the replacement of all profiles; the app restarts to apply it.
 */
export function RestorePanel() {
  const [open, setOpen] = useState(false);
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
    <div className="flex flex-col gap-3 border-t border-border py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-xl flex-col gap-0.5">
          <strong className="font-semibold">{m.restoreTitle}</strong>
          <span className="text-sm text-text-muted">{m.restoreHint}</span>
        </div>
        <Button type="button" variant="secondary" onClick={() => setOpen(!open)}>
          {open ? m.restoreClose : m.restoreOpen}
        </Button>
      </div>

      {open && (
        <div className="flex flex-col gap-2">
          {isLoading ? null : backups.length === 0 ? (
            <p className="text-sm text-text-muted">{m.restoreNone}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
              {backups.slice(0, SHOWN).map((b) => (
                <li
                  key={`${b.folder}:${b.fileName}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {m.lastBackupValue(b.createdAt, m.kinds[b.kind])}
                    </span>
                    <span className="text-xs break-all text-text-muted">
                      {m.restoreFolder[b.folder]} · {b.fileName}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={prepare.isPending}
                    onClick={() =>
                      void choose({ from: 'list', folder: b.folder, fileName: b.fileName })
                    }
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
            disabled={prepare.isPending}
            onClick={() => void choose({ from: 'dialog' })}
          >
            {m.restoreBrowse}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={preview !== null}
        onOpenChange={(next) => !next && !restore.isPending && setPreview(null)}
        title={m.restoreConfirmTitle}
        description={preview && <RestoreSummary preview={preview} />}
        confirmLabel={restore.isPending ? m.restoreRestarting : m.restoreConfirm}
        cancelLabel={m.restoreCancel}
        destructive
        busy={restore.isPending || restore.isSuccess}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}

function RestoreSummary({ preview }: { preview: RestorePreview }) {
  return (
    <span className="flex flex-col gap-2">
      <span>{m.restoreFrom(preview.fileName, preview.createdAt, preview.appVersion)}</span>
      <span>
        {preview.profiles.length > 0
          ? m.restoreProfiles(preview.profiles.join(', '))
          : m.restoreNoProfiles}
      </span>
      <span className="font-semibold text-text">{m.restoreWarning}</span>
    </span>
  );
}
