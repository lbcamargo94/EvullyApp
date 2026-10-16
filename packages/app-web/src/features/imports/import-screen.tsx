import {
  errorCode,
  useCancelImport,
  useConfirmImport,
  useCurrentProfile,
  usePreviewImport,
  useProfile,
  useSaveImportTemplate,
} from '@evully/app-core';
import type { ImportKind, ImportPreview } from '@evully/contracts';
import { Button, Card } from '@evully/ui';
import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ImportPreviewTable } from './import-preview-table';
import { importErrorByCode, importMessages as m } from './messages.pt-BR';

const backTo: Record<ImportKind, string> = {
  weights: '/app/weight',
  measurements: '/app/measurements',
};

const messageFor = (error: unknown) => importErrorByCode[errorCode(error) ?? ''] ?? m.genericError;

/** CSV import with mandatory preview (README §8.8). */
export function ImportScreen() {
  const { kind } = useParams();
  const { profileId } = useCurrentProfile();
  if (kind !== 'weights' && kind !== 'measurements') return <Navigate to="/app" replace />;
  if (!profileId) return null;
  return <ImportFlow key={kind} kind={kind} profileId={profileId} />;
}

function ImportFlow({ kind, profileId }: { kind: ImportKind; profileId: string }) {
  const navigate = useNavigate();
  const { data: profile } = useProfile(profileId);
  const confirm = useConfirmImport(profileId);
  const cancel = useCancelImport(profileId);
  const [current, setCurrent] = useState<ImportPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const importNow = async (preview: ImportPreview) => {
    try {
      const { imported } = await confirm.mutateAsync(preview.token);
      void navigate(backTo[kind], { replace: true, state: { notice: m.done(imported) } });
    } catch (error) {
      setMessage(messageFor(error));
    }
  };

  const leave = () => {
    if (current) cancel.mutate(current.token);
    void navigate(backTo[kind]);
  };

  const fileError = current?.fileError ? importErrorByCode[current.fileError] : null;

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Link to={backTo[kind]} className="text-sm font-medium text-brand-soft-foreground">
        ← {m.back[kind]}
      </Link>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold">{m.title[kind]}</h1>
        <p className="text-text-muted">{m.intro(profile?.name ?? '')}</p>
      </div>

      <FileCard
        kind={kind}
        profileId={profileId}
        fileName={current?.fileName ?? null}
        onPreview={(preview) => {
          setMessage(null);
          setCurrent(preview);
        }}
        onMessage={setMessage}
      />

      {(fileError ?? message) && (
        <p role="alert" className="text-sm text-text">
          {fileError ?? message}
        </p>
      )}

      {current && !current.fileError && (
        <PreviewResult
          preview={current}
          busy={confirm.isPending}
          onCancel={leave}
          onConfirm={() => void importNow(current)}
        />
      )}
    </div>
  );
}

/** File picker and template download. The file is read in the main process. */
function FileCard({
  kind,
  profileId,
  fileName,
  onPreview,
  onMessage,
}: {
  kind: ImportKind;
  profileId: string;
  fileName: string | null;
  onPreview: (preview: ImportPreview) => void;
  onMessage: (message: string | null) => void;
}) {
  const preview = usePreviewImport(profileId, kind);
  const template = useSaveImportTemplate(profileId, kind);

  const choose = async () => {
    onMessage(null);
    try {
      const result = await preview.mutateAsync();
      if (result) onPreview(result);
    } catch (error) {
      onMessage(messageFor(error));
    }
  };

  const saveTemplate = async () => {
    if (await template.mutateAsync()) onMessage(m.templateSaved);
  };

  const chooseLabel = fileName ? m.chooseOther : m.chooseFile;

  return (
    <Card aria-label={m.chooseFile}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-brand-soft text-brand-soft-foreground">
            <FileSpreadsheet aria-hidden="true" className="size-5" />
          </span>
          <div className="flex flex-col">
            <strong>{fileName ?? m.chooseFile}</strong>
            <span className="text-[13px] text-text-muted">{m.formats}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={fileName ? 'secondary' : 'primary'}
            disabled={preview.isPending}
            onClick={() => void choose()}
          >
            {preview.isPending ? m.reading : chooseLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={() => void saveTemplate()}>
            {m.template}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PreviewResult({
  preview,
  busy,
  onCancel,
  onConfirm,
}: {
  preview: ImportPreview;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { counts } = preview;
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Stat tone="positive" value={counts.ready} label={m.ready(counts.ready)} />
        <Stat tone="neutral" value={counts.duplicates} label={m.duplicates(counts.duplicates)} />
        <Stat tone="caution" value={counts.errors} label={m.errors(counts.errors)} />
      </div>
      {preview.newMeasurementTypes.length > 0 && (
        <p className="text-sm">{m.newTypes(preview.newMeasurementTypes.join(', '))}</p>
      )}
      <ImportPreviewTable preview={preview} />
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {m.cancel}
        </Button>
        <Button type="button" disabled={counts.ready === 0 || busy} onClick={onConfirm}>
          {busy ? m.importing : m.confirm(counts.ready, preview.kind)}
        </Button>
      </div>
    </>
  );
}

const statTones = {
  positive: 'bg-positive-soft text-positive',
  neutral: 'bg-neutral-soft text-neutral',
  caution: 'bg-caution-soft text-caution',
} as const;

function Stat({
  tone,
  value,
  label,
}: {
  tone: keyof typeof statTones;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-[1_1_160px] flex-col gap-1 rounded-md bg-surface p-4">
      <span className={`self-start rounded-md px-2 text-[28px] font-semibold ${statTones[tone]}`}>
        {value}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
