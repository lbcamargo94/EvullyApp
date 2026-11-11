import { useCurrentProfile, useExportTransfer, useTransferAvailable } from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ImportProfileButton } from '../profiles/import-profile-button';
import { transferMessages as m } from '../profiles/messages.pt-BR';

/** Settings › Perfil › "Transferir perfil" (README §14.4). */
export function TransferCard({ profileId }: { profileId: string }) {
  const available = useTransferAvailable();
  const exportTransfer = useExportTransfer(profileId);
  const { clear } = useCurrentProfile();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  if (!available) return null;

  const run = async () => {
    setFeedback(null);
    try {
      const result = await exportTransfer.mutateAsync();
      if (result) setFeedback({ ok: true, text: m.exported(result.fileName) });
    } catch {
      setFeedback({ ok: false, text: m.exportFailed });
    }
  };

  return (
    <Card aria-labelledby="transfer-title">
      <div className="flex flex-col gap-1">
        <h2 id="transfer-title" className="text-lg font-semibold">
          {m.title}
        </h2>
        <p className="max-w-xl text-sm text-text-muted">{m.hint}</p>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={exportTransfer.isPending}
          onClick={() => void run()}
        >
          {exportTransfer.isPending ? m.exporting : m.exportProfile}
        </Button>
        {/* Imported data may replace any profile: start again from the profile list. */}
        <ImportProfileButton
          onImported={() => {
            clear();
            void navigate('/profiles', { replace: true });
          }}
        />
      </div>
      {feedback && (
        <p
          role={feedback.ok ? 'status' : 'alert'}
          className={feedback.ok ? 'text-sm break-all text-text-muted' : 'text-sm text-danger'}
        >
          {feedback.text}
        </p>
      )}
    </Card>
  );
}
