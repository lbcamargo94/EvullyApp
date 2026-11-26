import { useExportAvailable, useExportProfile, useHealthSettings } from '@evully/app-core';
import type { ExportFormat } from '@evully/contracts';
import { Button, Card, Checkbox } from '@evully/ui';
import { useState } from 'react';
import { exportMessages as m } from './messages.pt-BR';

/** "Exportar dados" (README §14.3): the current profile as JSON or as a zip of CSVs. */
export function ExportCard({ profileId }: { profileId: string }) {
  const available = useExportAvailable();
  const health = useHealthSettings(profileId).data;
  // Exams leave the device only when this is ticked (README §27); off on every visit.
  const [includeHealth, setIncludeHealth] = useState(false);
  const exportProfile = useExportProfile(profileId, includeHealth);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  if (!available) return null;

  const run = async (format: ExportFormat) => {
    setFeedback(null);
    try {
      const result = await exportProfile.mutateAsync(format);
      if (result) setFeedback({ ok: true, text: m.done(result.fileName) });
    } catch {
      setFeedback({ ok: false, text: m.failed });
    }
  };

  const pending = exportProfile.isPending ? exportProfile.variables : null;
  return (
    <Card aria-labelledby="export-title">
      <div className="flex flex-col gap-1">
        <h2 id="export-title" className="text-heading font-semibold">
          {m.title}
        </h2>
        <p className="max-w-xl text-caption text-text-muted">{m.hint}</p>
      </div>
      <div className="flex flex-col gap-3">
        {health?.enabled && (
          <div className="flex items-start gap-3 text-body">
            <Checkbox
              id="export-include-health"
              checked={includeHealth}
              onChange={(e) => setIncludeHealth(e.target.checked)}
            />
            <label htmlFor="export-include-health" className="flex flex-col gap-0.5">
              <span>{m.includeHealth}</span>
              <span className="text-caption text-text-muted">{m.includeHealthHint}</span>
            </label>
          </div>
        )}
        <ExportOption
          label={pending === 'json' ? m.exporting : m.json}
          description={m.jsonHint}
          disabled={exportProfile.isPending}
          onClick={() => void run('json')}
        />
        <ExportOption
          label={pending === 'csv' ? m.exporting : m.csv}
          description={m.csvHint}
          disabled={exportProfile.isPending}
          onClick={() => void run('csv')}
        />
      </div>
      {feedback && (
        <p
          role={feedback.ok ? 'status' : 'alert'}
          className={
            feedback.ok ? 'text-caption break-all text-text-muted' : 'text-body text-danger'
          }
        >
          {feedback.text}
        </p>
      )}
    </Card>
  );
}

function ExportOption(props: {
  label: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      <span className="max-w-xl text-caption text-text-muted">{props.description}</span>
      <Button type="button" variant="secondary" disabled={props.disabled} onClick={props.onClick}>
        {props.label}
      </Button>
    </div>
  );
}
