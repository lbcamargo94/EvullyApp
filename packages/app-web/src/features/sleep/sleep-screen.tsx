import {
  errorCode,
  indicatorsOf,
  localToday,
  isoToLocalTime,
  useCurrentProfile,
  useDeleteSleep,
  useSleepLogs,
} from '@evully/app-core';
import type { SleepLogDto } from '@evully/contracts';
import { Button, Card, ConfirmDialog } from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  formatDayMonth,
  formatDuration,
  formatWeekday,
  qualityLabels,
  sleepErrorByCode,
  sleepMessages as m,
} from './messages.pt-BR';
import { SleepForm } from './sleep-form';
import { SleepIndicatorsCard } from './sleep-indicators';

/** Sleep (README §12): quick entry of a night and the history. */
export function SleepScreen() {
  const { profileId } = useCurrentProfile();
  const { data: nights } = useSleepLogs(profileId);
  const [editing, setEditing] = useState<SleepLogDto | null>(null);
  if (!profileId || !nights) return null;

  return (
    <>
      <h1 className="text-[26px] font-semibold">{m.title}</h1>
      <div className="flex flex-wrap items-start gap-6">
        <SleepForm
          key={editing?.id ?? 'new'}
          profileId={profileId}
          editing={editing}
          onDone={() => setEditing(null)}
          onEditDate={(date) => setEditing(nights.find((n) => n.sleepDate === date) ?? null)}
        />
        <SleepIndicatorsCard indicators={indicatorsOf(nights, localToday())} />
      </div>
      <History profileId={profileId} nights={nights} onEdit={setEditing} />
    </>
  );
}

function History({
  profileId,
  nights,
  onEdit,
}: {
  profileId: string;
  nights: SleepLogDto[];
  onEdit: (n: SleepLogDto) => void;
}) {
  const remove = useDeleteSleep(profileId);
  const [pending, setPending] = useState<SleepLogDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!pending) return;
    try {
      await remove.mutateAsync(pending.id);
      setError(null);
    } catch (e) {
      setError(sleepErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
    setPending(null);
  };

  return (
    <Card aria-labelledby="sleep-history-title" className="gap-2">
      <h2 id="sleep-history-title" className="text-lg font-semibold">
        {m.history}
      </h2>
      {nights.length === 0 && <p className="text-sm text-text-muted">{m.empty}</p>}
      <ul className="flex flex-col">
        {nights.map((n) => (
          <li key={n.id} className="flex flex-wrap items-center gap-2 border-t border-border py-2">
            <span className="w-24 text-sm text-text-muted">{formatWeekday(n.sleepDate)}</span>
            <span className="flex-1">
              <span className="font-semibold tabular-nums">
                {formatDuration(n.durationMinutes)}
              </span>
              <span className="text-sm text-text-muted tabular-nums">
                {' · '}
                {[
                  m.span(isoToLocalTime(n.sleepTime ?? n.bedTime), isoToLocalTime(n.wakeTime)),
                  n.quality ? qualityLabels[n.quality] : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.edit(formatDayMonth(n.sleepDate))}
              onClick={() => onEdit(n)}
            >
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.remove(formatDayMonth(n.sleepDate))}
              onClick={() => setPending(n)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={m.removeTitle}
        description={m.removeBody}
        confirmLabel={m.removeConfirm}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirm()}
      />
    </Card>
  );
}
