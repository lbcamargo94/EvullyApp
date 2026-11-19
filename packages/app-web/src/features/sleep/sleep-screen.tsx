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
import {
  Card,
  ConfirmDialog,
  EmptyState,
  Icon,
  IconButton,
  ScreenHeader,
  ShowMoreButton,
  useShowMore,
} from '@evully/ui';
import { sharedMessages } from '../shared/messages.pt-BR';
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

/** Nights shown at first and added per "Mostrar mais". */
const STEP = 30;
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
      <ScreenHeader title={m.title} />
      <div className="flex flex-wrap items-start gap-6">
        <SleepForm
          key={editing?.id ?? 'new'}
          profileId={profileId}
          editing={editing}
          onDone={() => setEditing(null)}
          onEditDate={(date) => setEditing(nights.find((n) => n.sleepDate === date) ?? null)}
        />
        <SleepIndicatorsCard
          profileId={profileId}
          indicators={indicatorsOf(nights, localToday())}
        />
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
  const { visible, hidden, showMore } = useShowMore(nights, STEP);
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
      <h2 id="sleep-history-title" className="text-heading font-semibold">
        {m.history}
      </h2>
      {nights.length === 0 && <EmptyState>{m.empty}</EmptyState>}
      <ul className="flex flex-col">
        {visible.map((n) => (
          <li key={n.id} className="flex flex-wrap items-center gap-2 border-t border-border py-2">
            <span className="w-24 text-caption text-text-muted">{formatWeekday(n.sleepDate)}</span>
            <span className="flex-1">
              <span className="font-semibold tabular-nums">
                {formatDuration(n.durationMinutes)}
              </span>
              <span className="text-caption text-text-muted tabular-nums">
                {' · '}
                {[
                  m.span(isoToLocalTime(n.sleepTime ?? n.bedTime), isoToLocalTime(n.wakeTime)),
                  n.quality ? qualityLabels[n.quality] : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <IconButton label={m.edit(formatDayMonth(n.sleepDate))} onClick={() => onEdit(n)}>
              <Icon icon={Pencil} />
            </IconButton>
            <IconButton label={m.remove(formatDayMonth(n.sleepDate))} onClick={() => setPending(n)}>
              <Icon icon={Trash2} />
            </IconButton>
          </li>
        ))}
      </ul>
      <ShowMoreButton hidden={hidden} onClick={showMore}>
        {sharedMessages.showMore(Math.min(hidden, STEP))}
      </ShowMoreButton>
      {error && (
        <p role="alert" className="text-body text-danger">
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
