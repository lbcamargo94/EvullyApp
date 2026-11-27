import {
  errorCode,
  useAttachHealthDocument,
  useOpenHealthDocument,
  useRemoveHealthDocument,
  useSaveHealthDocument,
} from '@evully/app-core';
import type { HealthExamDto } from '@evully/contracts';
import { Button, ConfirmDialog, Icon } from '@evully/ui';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import {
  documentErrorByCode,
  documentMessages as m,
  formatExamDate,
  formatFileSize,
  healthMessages,
} from './messages.pt-BR';

/** The laboratory PDF of one exam (README §24.2): attach, open, save a copy or remove. */
export function ExamDocument({ profileId, exam }: { profileId: string; exam: HealthExamDto }) {
  const attach = useAttachHealthDocument(profileId);
  const open = useOpenHealthDocument(profileId);
  const save = useSaveHealthDocument(profileId);
  const remove = useRemoveHealthDocument(profileId);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);
  const document = exam.document;

  const run = async (action: () => Promise<unknown>, done?: string) => {
    setStatus(null);
    try {
      const result = await action();
      if (done && result !== false) setStatus({ error: false, text: done });
    } catch (e) {
      const text = documentErrorByCode[errorCode(e) ?? ''] ?? healthMessages.genericError;
      setStatus({ error: true, text });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
      {document ? (
        <>
          <span className="flex min-w-40 flex-1 items-center gap-2 text-caption">
            <Icon icon={FileText} />
            <span className="font-semibold">{document.fileName}</span>
            <span className="text-text-muted">{formatFileSize(document.sizeBytes)}</span>
          </span>
          <Button variant="secondary" onClick={() => void run(() => open.mutateAsync(document.id))}>
            {m.open}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void run(() => save.mutateAsync(document.id), m.saved)}
          >
            {m.saveCopy}
          </Button>
          <Button variant="ghost" onClick={() => void run(() => attach.mutateAsync(exam.id))}>
            {m.replace}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            {m.remove}
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-caption text-text-muted">{m.hint}</span>
          <Button
            variant="secondary"
            aria-label={m.attach(formatExamDate(exam.collectedOn))}
            disabled={attach.isPending}
            onClick={() => void run(() => attach.mutateAsync(exam.id))}
          >
            <Icon icon={FileText} />
            {m.attachShort}
          </Button>
        </>
      )}
      {status && (
        <p
          role={status.error ? 'alert' : 'status'}
          className={status.error ? 'w-full text-body text-danger' : 'w-full text-caption'}
        >
          {status.text}
        </p>
      )}
      {document && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={m.removeTitle}
          description={m.removeBody}
          confirmLabel={m.removeConfirm}
          cancelLabel={healthMessages.cancel}
          destructive
          busy={remove.isPending}
          onConfirm={() => {
            setConfirming(false);
            void run(() => remove.mutateAsync(document.id));
          }}
        />
      )}
    </div>
  );
}
