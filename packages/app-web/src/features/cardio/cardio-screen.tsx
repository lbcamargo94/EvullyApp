import {
  addDays,
  errorCode,
  parseLocalDate,
  useCardioOverview,
  useCurrentProfile,
  useDeleteCardio,
} from '@evully/app-core';
import type { CardioOverview, CardioSessionDto } from '@evully/contracts';
import { Button, Card, ConfirmDialog } from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CardioForm } from './cardio-form';
import {
  activityLabels,
  cardioErrorByCode,
  cardioMessages as m,
  formatDayMonth,
  formatKm,
  formatWeekday,
  intensityLabels,
} from './messages.pt-BR';

type Week = CardioOverview['thisWeek'];

const labelOf = (s: Pick<CardioSessionDto, 'activityType' | 'activityName'>) =>
  s.activityType === 'custom'
    ? (s.activityName ?? activityLabels.custom)
    : activityLabels[s.activityType];

const weekLine = (w: Week) =>
  [m.sessions(w.sessions), m.minutes(w.minutes), w.distanceKm > 0 ? formatKm(w.distanceKm) : null]
    .filter(Boolean)
    .join(' · ');

/** Cardio (README §11.1, §16.2): quick entry, this week and history by week. */
export function CardioScreen() {
  const { profileId } = useCurrentProfile();
  const { data: overview } = useCardioOverview(profileId);
  const [editing, setEditing] = useState<CardioSessionDto | null>(null);
  if (!profileId || !overview) return null;

  return (
    <>
      <h1 className="text-[26px] font-semibold">{m.title}</h1>
      <div className="flex flex-wrap items-start gap-6">
        <CardioForm
          key={editing?.id ?? 'new'}
          profileId={profileId}
          editing={editing}
          onDone={() => setEditing(null)}
        />
        <ThisWeek week={overview.thisWeek} />
      </div>
      <section aria-label={m.history} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{m.history}</h2>
        {overview.weeks.length === 0 && <Card>{m.empty}</Card>}
        {overview.weeks.map((w) => (
          <WeekCard key={w.summary.weekStart} profileId={profileId} week={w} onEdit={setEditing} />
        ))}
      </section>
    </>
  );
}

function ThisWeek({ week }: { week: Week }) {
  return (
    <Card aria-labelledby="cardio-week-title" className="flex-[1_1_280px] gap-3">
      <h2 id="cardio-week-title" className="text-lg font-semibold">
        {m.thisWeek}
      </h2>
      <span className="text-[32px] leading-tight font-semibold tabular-nums">
        {m.minutes(week.minutes)}
      </span>
      <span className="text-sm text-text-muted">{weekLine(week)}</span>
      {week.byActivity.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {week.byActivity.map((a) => (
            <li
              key={`${a.activityType}:${a.activityName ?? ''}`}
              className="flex justify-between gap-3 tabular-nums"
            >
              <span>{labelOf(a)}</span>
              <span className="text-text-muted">{weekLine({ ...week, ...a, byActivity: [] })}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function WeekCard({
  profileId,
  week,
  onEdit,
}: {
  profileId: string;
  week: CardioOverview['weeks'][number];
  onEdit: (s: CardioSessionDto) => void;
}) {
  const remove = useDeleteCardio(profileId);
  const [pending, setPending] = useState<CardioSessionDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = week.summary.weekStart;
  const title = m.weekOf(formatDayMonth(start), formatDayMonth(addDays(parseLocalDate(start), 6)));

  const confirm = async () => {
    if (!pending) return;
    try {
      await remove.mutateAsync(pending.id);
      setError(null);
    } catch (e) {
      setError(cardioErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
    setPending(null);
  };

  return (
    <Card aria-label={title} className="gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-sm text-text-muted tabular-nums">{weekLine(week.summary)}</span>
      </div>
      <ul className="flex flex-col">
        {week.sessions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 border-t border-border py-2">
            <span className="w-24 text-sm text-text-muted">{formatWeekday(s.sessionDate)}</span>
            <span className="flex-1">
              <span className="font-medium">{labelOf(s)}</span>
              <span className="text-sm text-text-muted tabular-nums">
                {' · '}
                {[
                  m.minutes(s.durationMinutes),
                  s.distanceKm !== null ? formatKm(s.distanceKm) : null,
                  s.intensity ? intensityLabels[s.intensity] : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.edit(labelOf(s))}
              onClick={() => onEdit(s)}
            >
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.remove(labelOf(s))}
              onClick={() => setPending(s)}
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
