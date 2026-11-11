import {
  errorCode,
  useCancelProfileImport,
  useConfirmProfileImport,
  usePrepareProfileImport,
  useTransferAvailable,
} from '@evully/app-core';
import type { TransferImportResult, TransferPreview } from '@evully/contracts';
import { Button, ConfirmDialog } from '@evully/ui';
import { useState } from 'react';
import { transferMessages as m } from './messages.pt-BR';

/**
 * "Importar perfil" (README §14.4): pick a transfer file, see what it holds
 * and confirm; a profile with the same id is replaced only after confirmation.
 */
export function ImportProfileButton({
  onImported,
  variant = 'secondary',
}: {
  onImported: (result: TransferImportResult) => void;
  variant?: 'secondary' | 'ghost';
}) {
  const available = useTransferAvailable();
  const prepare = usePrepareProfileImport();
  const confirm = useConfirmProfileImport();
  const cancel = useCancelProfileImport();
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!available) return null;

  const fail = (e: unknown) => setError(m.errors[errorCode(e) ?? ''] ?? m.failed);

  const choose = async () => {
    setError(null);
    try {
      setPreview(await prepare.mutateAsync());
    } catch (e) {
      fail(e);
    }
  };

  const close = () => {
    if (preview) cancel.mutate(preview.token);
    setPreview(null);
  };

  const run = async () => {
    if (!preview) return;
    try {
      const result = await confirm.mutateAsync(preview.token);
      setPreview(null);
      onImported(result);
    } catch (e) {
      setPreview(null);
      fail(e);
    }
  };

  const replacing = preview?.existing != null;
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant={variant}
        disabled={prepare.isPending}
        onClick={() => void choose()}
      >
        {m.importProfile}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={preview !== null}
        onOpenChange={(next) => !next && !confirm.isPending && close()}
        title={replacing ? m.replaceTitle : m.importTitle}
        description={preview && <TransferSummary preview={preview} />}
        confirmLabel={confirm.isPending ? m.importing : replacing ? m.replace : m.confirmImport}
        cancelLabel={m.cancel}
        destructive={replacing}
        busy={confirm.isPending}
        onConfirm={() => void run()}
      />
    </div>
  );
}

function TransferSummary({ preview }: { preview: TransferPreview }) {
  return (
    <span className="flex flex-col gap-2">
      <span>{m.from(preview.profileName, preview.exportedAt, preview.appVersion)}</span>
      <span>{m.counts(preview.counts)}</span>
      {preview.existing ? (
        <span className="font-semibold text-text">
          {m.replaceWarning(preview.existing.name, preview.existing.archived)}
        </span>
      ) : (
        <span>{m.willCreate}</span>
      )}
    </span>
  );
}
